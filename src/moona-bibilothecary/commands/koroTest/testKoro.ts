import { Message } from 'discord.js';
import _ from 'lodash';

import addStreamMain from '../../database/KoroQuery/addStreamMain';
import checkDataReadiness from '../../database/KoroQuery/checkDataReadiness';
import finalizedData from '../../database/KoroQuery/finalizedData';
import { RowLines, RowMain } from '../../type/local';
import { koro2 as koro } from './koroExample';

export async function onKoroMessage(message: Message) {
  try {
    const { embeds } = message;
    if (!embeds || !embeds.length) return {};
    const { title, description } = embeds[0];
    if (!description) return {};
    const lines = description.split("\n");
    let main: RowMain | undefined;
    if (title === "Tags") {
      const resMain =
        /^https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9]+) start time: (\d{2}:\d{2}:\d{2}) JST \((\d+)\)$/.exec(
          lines[0]
        ) || [];
      if (resMain) {
        const [, streamId, timeText, numLinesText] = resMain;
        const totalLines = Number(numLinesText);
        main = { streamId, timeText, totalLines };
        lines.splice(0, 1);
      }
    }

    const descriptionParsed: Array<RowLines> = lines.map((line, idx) => {
      const resDescrip =
        /^(.*)\[((?:\d+h)?(?:\d+m)?\d+s)\]\(https:\/\/youtu\.be\/([a-zA-Z0-9]+)\?t=((?:(\d+)h)?(?:(\d+)m)?(\d+)s)\)$/.exec(
          line
        );
      if (!resDescrip)
        return {
          identifier: "",
          fullLine: line.trim(),
          idx,
        };
      const [, fullLine, tsText, streamId, , h, m, s] = resDescrip;
      const hours = Number(h) || 0;
      const minutes = Number(m) || 0;
      const seconds = Number(s) || 0;
      const subResDescrip = /^\D*(\d*)\D*songs?.*:(.*)$/.exec(fullLine);
      if (!subResDescrip)
        return {
          identifier: "",
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
        identifier: "",
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
      descriptionParsed
        .map((item) => item?.songNumber)
        .filter((x) => x !== undefined)
    );
    const descriptionFinal = descriptionParsed.filter(
      (x) => x
    ) as Array<RowLines>;

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
      { max: 0, maxId: "" }
    );

    descriptionFinal.forEach((item) => {
      item.avgSongNumber = avgSongNumber;
      item.identifier = [item.streamId, item.idx, item.avgSongNumber].join(
        ", "
      );
      item.streamId = currentStreamId;
    });

    // await addStreamLine(descriptionFinal, {
    //   streamId: currentStreamId,
    //   avgSongNumber,
    // });
    if (main) await addStreamMain(main);

    if (!currentStreamId) currentStreamId = main?.streamId || "";

    const lineReady = await checkDataReadiness(
      currentStreamId,
      main?.totalLines
    );

    if (lineReady) finalizedData(currentStreamId, descriptionFinal);
  } catch (err) {
    console.error(err);
  }
}

onKoroMessage(koro as unknown as Message);
