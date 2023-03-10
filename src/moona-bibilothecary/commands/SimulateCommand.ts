import { each } from 'bluebird';
import { format, fromUnixTime } from 'date-fns';
import { Message } from 'discord.js';
import _ from 'lodash';

import korotaggerInfo from '../config/korotaggerInfo';
import moonaEmoji from '../config/moonaEmoji';
import { DEV } from '../config/secrets';
import addStreamMain from '../database/KoroQuery/addStreamMain';
import buildEmbedPost from '../database/KoroQuery/buildEmbedPost';
import checkDataReadiness, { getDataReadiness, StreamDetails } from '../database/KoroQuery/checkDataReadiness';
import finalizedData from '../database/KoroQuery/finalizedData';
import { RowLines, RowMain } from '../type/local';
import { Command, CommandInterface } from './commandInterface';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class SimulateCommand extends Command implements CommandInterface {
  commandNames = ['simulate', 'sim'];
  args = [];
  postHistory: Array<string> = [];

  help(): string {
    return this.helpText('This is command for simulating korotagger !tags interpretion');
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    const [, ..._payload] = args;
    let payload = _payload
      .join(' ')
      .split(/\n/g)
      .filter((x) => x);
    this.onKoroMessage(message, payload);
  }

  async onKoroMessage(message: Message, lines: Array<string>) {
    let main: RowMain | undefined;

    const resMain =
      /^https:\/\/(?:(?:www\.youtube\.com\/watch\?v=)|(?:youtu\.be\/))(.+) start time: (\d{1,2}:\d{1,2}:\d{1,2}) JST \((\d+)\)$/.exec(
        lines[0],
      );

    let streamId: string;

    if (resMain) {
      const [, _streamId, timeText, numLinesText] = resMain;
      const totalLines = Number(numLinesText);
      streamId = _streamId;
      main = { streamId, timeText, totalLines };
      console.log(
        '🚀 ~ file: SimulateCommand.ts ~ line 52 ~ SimulateCommand ~ onKoroMessage ~ main',
        main,
      );
      lines.splice(0, 1);
    } else {
      /** Koro got a breaking change as of 11/4/22 */
      const resNewKoroMain =
        /^https:\/\/www\.youtube\.com\/watch\?v=(.+) <t:(\d+)> (\d+) tags \(([\d\.]+)\/min\)$/.exec(
          lines[0],
        );
      console.log(
        '🚀 ~ file: KoroTaggerCommand.ts ~ line 71 ~ KoroTaggerCommand ~ onKoroMessage ~ resNewKoroMain',
        { resNewKoroMain, line: lines[0] },
      );
      if (resNewKoroMain) {
        const [, _streamId, timestampText, numLinesText, rateAnalysis] = resNewKoroMain;
        streamId = _streamId;
        const totalLines = Number(numLinesText);
        const timestampNum = Number(timestampText);
        const timeText = format(timestampNum, 'H:MM:ss');
        main = { streamId, timeText, totalLines };
        lines.splice(0, 1);
      } else return;
    }

    console.log(
      '🚀 ~ file: SimulateCommand.ts ~ line 50 ~ SimulateCommand ~ onKoroMessage ~ lines',
      lines,
    );

    const descriptionParsed: Array<RowLines> = lines.map((line, idx) => {
      const resDescrip = /^(.*?)((?:(\d+)h)?(?:(\d+)m)?(\d+)s)$/.exec(line);
      if (!resDescrip)
        return {
          identifier: '',
          fullLine: line.trim(),
          idx,
        };
      const [, fullLine, tsText, h, m, s] = resDescrip;
      const hours = Number(h) || 0;
      const minutes = Number(m) || 0;
      const seconds = Number(s) || 0;
      const subResDescrip = /^\D*(\d*)\D*[sS]ongs?.*?:\s*(.*?)(?:\s*\(\d+\)\s*)?$/.exec(fullLine);

      if (!subResDescrip)
        return {
          identifier: '',
          idx,
          tsText,
          streamId,
          fullLine: fullLine.trim(),
          hours,
          minutes,
          seconds,
          ts: 3600 * hours + 60 * minutes + seconds,
        };
      const [, songNumber, songName] = subResDescrip;
      return {
        identifier: '',
        idx,
        songNumber: Number(songNumber),
        songName: songName.trim(),
        tsText,
        streamId,
        fullLine: fullLine.trim(),
        hours,
        minutes,
        seconds,
        ts: 3600 * hours + 60 * minutes + seconds,
      };
    });

    const avgSongNumber = _.mean(
      descriptionParsed.map((item) => item?.songNumber).filter((x) => x !== undefined),
    );
    const descriptionFinal = descriptionParsed.filter((x) => x) as Array<RowLines>;

    const statStreamId: Record<string, number> = {};
    descriptionFinal.forEach((item) => {
      if (!item.streamId) return;
      if (!statStreamId[item.streamId]) statStreamId[item.streamId] = 1;
      else statStreamId[item.streamId]++;
    });

    let { maxId: currentStreamId } = _.entries(statStreamId).reduce(
      ({ max, maxId }, [key, val]) => {
        if (max < val) return { max: val, maxId: key };
        return { max, maxId };
      },
      { max: 0, maxId: '' },
    );

    descriptionFinal.forEach((item) => {
      item.avgSongNumber = avgSongNumber;
      item.identifier = [item.streamId, item.idx, item.avgSongNumber].join(', ');
      item.streamId = currentStreamId;
    });

    // console.log(
    //   "🚀 ~ file: KoroTaggerCommand.ts ~ line 161 ~ KoroTaggerCommand ~ onKoroMessage ~ descriptionFinal",
    //   { descriptionFinal, currentStreamId, avgSongNumber, main }
    // );

    if (main) await addStreamMain(main);

    if (!currentStreamId) currentStreamId = main?.streamId || '';

    const streamDetails = await getDataReadiness(currentStreamId);
    console.log(
      '🚀 ~ file: SimulateCommand.ts ~ line 142 ~ SimulateCommand ~ onKoroMessage ~ streamDetails.isReady',
      streamDetails.isReady,
    );
    if (!streamDetails.isReady) return;

    const description = await finalizedData(currentStreamId, descriptionFinal);

    await this.postFinalKaraoke(streamDetails, description);

    message.react(moonaEmoji.approb);
  }

  async postFinalKaraoke(streamDetails: StreamDetails, description: Array<string>): Promise<void> {
    const yt = streamDetails;
    console.log(
      '🚀 ~ file: korotaggerCommand.ts ~ line 179 ~ KoroTaggerCommand ~ streamDetails',
      streamDetails,
    );
    if (this.postHistory.find((post) => post === yt.streamId)) return;
    this.postHistory.push(yt.streamId);
    const publishedDate = fromUnixTime(yt.timestamp!);
    const channelPosting = await korotaggerInfo.getChannelPost();
    if (!channelPosting) throw 'There is no current set channel to post karaoke.';

    const embeds = buildEmbedPost({
      title: yt.title!,
      streamLink: 'https://youtu.be/' + yt.streamId,
      isArchive: yt.isArchive!,
      isKaraoke: yt.isKaraoke!,
      isMoona: yt.isMoona!,
      imageLink: yt.thumbnailUrl!,
      description,
      publishedDate,
    });

    if (!embeds) return;

    let reply: Message | undefined;

    await each(embeds, async (embed) => {
      reply = await channelPosting.send({ embeds: [embed] });
    });

    let nameTitle = 'Moona Stream ';
    if (!yt.isMoona) nameTitle = 'Moona Collab ';
    else if (yt.isKaraoke) nameTitle = 'MoonUtau ';
    if (!reply) {
      throw new Error('There is no reply');
    }
    await reply.startThread({
      name:
        nameTitle +
        (yt.isArchive ? 'Archive' : 'Unarchive') +
        ' - ' +
        format(publishedDate, 'd MMM yyyy'),
      autoArchiveDuration: DEV ? 1440 : 4320,
    });
    console.log('done');
    // await SQL.insertIntoUpdate(
    //   "stream_main",
    //   { isDone: false, streamId: yt.streamId },
    //   "streamId"
    // );
  }
}
