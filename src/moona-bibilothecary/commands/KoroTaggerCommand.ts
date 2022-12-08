import { each } from 'bluebird';
import { format, fromUnixTime } from 'date-fns';
import { Collection, Message } from 'discord.js';
import _ from 'lodash';

import korotaggerInfo from '../config/korotaggerInfo';
import moonaEmoji from '../config/moonaEmoji';
import { DEV } from '../config/secrets';
import addStreamMain from '../database/KoroQuery/addStreamMain';
import buildEmbedPost from '../database/KoroQuery/buildEmbedPost';
import checkDataReadiness, { getDataReadiness, StreamDetails } from '../database/KoroQuery/checkDataReadiness';
import finalizedData from '../database/KoroQuery/finalizedData';
import SQL from '../database/SQL';
import { getStreamDetails } from '../database/YoutubeQuery/getStreamDetails';
import imgur from '../imgur';
import { RowLines, RowMain } from '../type/local';
import { Command, CommandInterface } from './commandInterface';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export class KoroTaggerCommand extends Command implements CommandInterface {
  commandNames = [];
  args = [];
  postHistory: Array<string> = [];

  help(): string {
    return this.helpText("This is command for korotagger interpretion");
  }

  async run(message: Message): Promise<void> {
    let activeStreamRes =
      /^\s*Active stream set <https:\/\/www\.youtube\.com\/watch\?v=(.+?)>\s*$/.exec(
        message.content
      );
    if (activeStreamRes) {
      const [, streamId] = activeStreamRes;
      console.log(`Active stream set ${streamId}`);
      await this.onKoroActiveStream(message, streamId);
    } else await this.onKoroMessage(message);
  }

  async onKoroActiveStream(message: Message, streamId: string) {
    try {
      const streamRes = await getStreamDetails(streamId);
      if (!streamRes)
        return message.reply(
          `Active stream at https://www.youtube.com/watch?v=${streamId} not found`
        );
      const json = await imgur.uploadUrl(streamRes.thumbnailUrl, "VAwVpeR");
      await SQL.insertIntoUpdate(
        "stream_main",
        { ...streamRes, thumbnailUrl: json.link, streamId },
        "streamId"
      );
      if (!message.deleted) await message.react(moonaEmoji.approb);
    } catch (err) {
      console.error(err);
    }
  }

  async parseEachMessage(message: Message) {
    const { embeds } = message;
    if (!embeds || !embeds.length) return;
    const { title, description } = embeds[0];
    if (!description) return;
    const lines = description.split("\n");
    let main: RowMain | undefined;
    if (title === "Tags") {
      const resMain =
        /^https:\/\/www\.youtube\.com\/watch\?v=(.+) start time: (\d{1,2}:\d{1,2}:\d{1,2}) JST \((\d+)\)$/.exec(
          lines[0]
        );
      console.log(
        "🚀 ~ file: KoroTaggerCommand.ts ~ line 71 ~ KoroTaggerCommand ~ onKoroMessage ~ resMain",
        { resMain, line: lines[0] }
      );
      if (resMain) {
        const [, streamId, timeText, numLinesText] = resMain;
        const totalLines = Number(numLinesText);
        main = { streamId, timeText, totalLines };
        lines.splice(0, 1);
      } else {
        /** Koro got a breaking change as of 11/4/22 */
        const resNewKoroMain =
          /^https:\/\/www\.youtube\.com\/watch\?v=(.+) <t:(\d+)> (\d+) tags \(([\d\.]+)\/min\)$/.exec(
            lines[0]
          );
        console.log(
          "🚀 ~ file: KoroTaggerCommand.ts ~ line 71 ~ KoroTaggerCommand ~ onKoroMessage ~ resNewKoroMain",
          { resNewKoroMain, line: lines[0] }
        );
        if (resNewKoroMain) {
          const [, streamId, timestampText, numLinesText, rateAnalysis] =
            resNewKoroMain;
          const totalLines = Number(numLinesText);
          const timestampNum = Number(timestampText);
          const timeText = format(timestampNum, "H:MM:ss");
          main = { streamId, timeText, totalLines };
          lines.splice(0, 1);
        }
      }
    }

    const descriptionParsed: Array<RowLines> = lines.map((line, idx) => {
      const resDescrip =
        /^(.*)\[((?:\d+h)?(?:\d+m)?\d+s)\]\(https:\/\/youtu\.be\/(.*)\?t=((?:(\d+)h)?(?:(\d+)m)?(\d+)s)\)$/.exec(
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
      const subResDescrip =
        /^\D*(\d*)\D*[sS]ongs?.*?:\s*(.*?)(?:\s*\(\d+\)\s*)?$$/.exec(fullLine);

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

    return { main, description: descriptionParsed };
  }

  async parseMessages(messages: Collection<string, Message>) {
    const output: {
      main?: RowMain;
      description: Array<RowLines>;
      messages: Array<Message>;
    } = {
      description: [],
      messages: [],
    };
    for (const [key, value] of messages.entries()) {
      const res = await this.parseEachMessage(value);
      if (!res) return output;
      const { main, description } = res;
      if (main && output.main) return output;
      output.main = main;
      output.description = [...description, ...output.description];
      output.messages.push(value);
    }
    return output;
  }

  async onKoro(messages: Collection<string, Message>) {
    const output = await this.parseMessages(messages);
    if (output.main?.totalLines !== output.description.length) return null;
    return {
      ...output,
      description: output.description.map((line, idx) => ({ ...line, idx })),
    };
  }

  async onKoroMessage(message: Message): Promise<void> {
    const channel = await message.channel.fetch();
    if (channel?.isText()) {
      const messages = await channel.messages.fetch({ limit: 10 });
      const output = await this.onKoro(messages);
      if (!output) return;
      if (!output.main) return;
      if (output.description.length === 0) return;

      const avgSongNumber = _.mean(
        output.description
          .map((item) => item?.songNumber)
          .filter((x) => x !== undefined && x > 0)
      );
      const descriptionFinal = output.description.filter(
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

      console.log(
        "🚀 ~ file: KoroTaggerCommand.ts ~ line 161 ~ KoroTaggerCommand ~ onKoroMessage ~ descriptionFinal",
        { descriptionFinal, currentStreamId, avgSongNumber, main: output.main }
      );

      // await addStreamLine(descriptionFinal, {
      //   streamId: currentStreamId,
      //   avgSongNumber,
      // });

      await addStreamMain(output.main);

      const streamDetails = await getDataReadiness(currentStreamId);
      if (!streamDetails.isReady) return;
      const description = await finalizedData(
        currentStreamId,
        output.description
      );

      if (!description.length) return;

      await this.postFinalKaraoke(streamDetails, description);

      output.messages.forEach((messageCheck) => {
        if (!messageCheck.deleted) message.react(moonaEmoji.approb);
      });
    }
  }

  async postFinalKaraoke(
    streamDetails: StreamDetails,
    description: Array<string>
  ): Promise<void> {
    const yt = streamDetails;
    console.log(
      "🚀 ~ file: korotaggerCommand.ts ~ line 179 ~ KoroTaggerCommand ~ streamDetails",
      { streamDetails, description }
    );
    if (this.postHistory.find((post) => post === yt.streamId)) return;
    this.postHistory.push(yt.streamId);
    const publishedDate = fromUnixTime(yt.timestamp!);
    const channelPosting = await korotaggerInfo.getChannelPost();
    if (!channelPosting)
      throw "There is no current set channel to post karaoke.";

    const embeds = buildEmbedPost({
      title: yt.title!,
      streamLink: "https://youtu.be/" + yt.streamId,
      isArchive: yt.isArchive!,
      isKaraoke: yt.isKaraoke!,
      isMoona: yt.isMoona!,
      imageLink: yt.thumbnailUrl!,
      description,
      publishedDate,
    });

    let reply: Message | undefined;

    await each(embeds, async (embed) => {
      reply = await channelPosting.send({ embeds: [embed] });
    });

    let nameTitle = "Moona Stream ";
    if (!yt.isMoona) nameTitle = "Moona Collab ";
    else if (yt.isKaraoke) nameTitle = "MoonUtau ";
    if (!reply) {
      throw new Error("There is no reply");
    }
    await reply.startThread({
      name:
        nameTitle +
        (yt.isArchive ? "Archive" : "Unarchive") +
        " - " +
        format(publishedDate, "d MMM yyyy"),
      autoArchiveDuration: DEV ? 1440 : 4320,
    });

    await SQL.insertIntoUpdate(
      "stream_main",
      { isDone: true, streamId: yt.streamId },
      "streamId"
    );
  }
}

// 1st song: Me and My Broken Heart - Rixton [4m15s](https://youtu.be/LJ3EFe_hyoc?t=4m15s)'
// 2nd song: Someone You Loved - Lewis Capaldi [7m26s](https://youtu.be/LJ3EFe_hyoc?t=7m26s)'
// 3rd song: Fall For You - Secondhand Serenade [12m10s](https://youtu.be/LJ3EFe_hyoc?t=12m10s)'
// 4th song: Starlight - Muse (2) [15m55s](https://youtu.be/LJ3EFe_hyoc?t=15m55s)'
// 5th Song: Hysteria - Muse [20m32s](https://youtu.be/LJ3EFe_hyoc?t=20m32s)'
// 6th Song: It's My Life - Bon Jovi [24m43s](https://youtu.be/LJ3EFe_hyoc?t=24m43s)"
// 7th Song: You and I - Lady Gaga [28m25s](https://youtu.be/LJ3EFe_hyoc?t=28m25s)'
// 8th Song: TiK ToK - Ke$ha [35m51s](https://youtu.be/LJ3EFe_hyoc?t=35m51s)'
// 9th song: Bleeding love - Leona Lewis [40m41s](https://youtu.be/LJ3EFe_hyoc?t=40m41s)'
// 10th Song: I Will Always Love You - Whitney Houston [46m45s](https://youtu.be/LJ3EFe_hyoc?t=46m45s)',
// 11th Song: Speechless - Naomi Scott [54m37s](https://youtu.be/LJ3EFe_hyoc?t=54m37s)'
// 12th Song: Healing Incantation - Mandy Moore [1h30s](https://youtu.be/LJ3EFe_hyoc?t=1h30s)'
// 13th Song: Touch the Sky - Julie Fowlis [1h2m2s](https://youtu.be/LJ3EFe_hyoc?t=1h2m2s)'
// 14th Song: The Circle of Life - The Lion King [1h5m10s](https://youtu.be/LJ3EFe_hyoc?t=1h5m10s)'
// 15th Song: One Jump Ahead - Aladdin [1h9m56s](https://youtu.be/LJ3EFe_hyoc?t=1h9m56s)'
// 17th song: Reflection -  Christina Aguilera \\(Mulan\\) [1h17m3s](https://youtu.be/LJ3EFe_hyoc?t=1h17m3s)',
// 18th song: Judas - Lady Gaga [1h18m32s](https://youtu.be/LJ3EFe_hyoc?t=1h18m32s)'
// 19th song: Bad Romance - Lady Gaga [1h24m27s](https://youtu.be/LJ3EFe_hyoc?t=1h24m27s)'
// 20th song: Shallow - Lady Gaga [1h29m22s](https://youtu.be/LJ3EFe_hyoc?t=1h29m22s)'
// 21th song: Deja Vu - Olivia Rodrigo (1) [1h34m0s](https://youtu.be/LJ3EFe_hyoc?t=1h34m0s)'
// 22th song: Happier - Olivia Rodrigo [1h37m31s](https://youtu.be/LJ3EFe_hyoc?t=1h37m31s)'
// 23th song: Good 4 u - Olivia Rodrigo [1h42m21s](https://youtu.be/LJ3EFe_hyoc?t=1h42m21s)
// 24th song: Hopelessly Devoted to You - Grease [1h50m46s](https://youtu.be/LJ3EFe_hyoc?t=1h50m46s)'
// 25th song: Mamma Mia - ABBA [2h1s](https://youtu.be/LJ3EFe_hyoc?t=2h1s)'
// 26th song: Attention - Charlie Puth [2h4m56s](https://youtu.be/LJ3EFe_hyoc?t=2h4m56s)'
// 27th song: Without You - David Guetta ft Usher [2h9m8s](https://youtu.be/LJ3EFe_hyoc?t=2h9m8s)'
// 28th song: Sweet child O'mine - Guns n Roses [2h14m57s](https://youtu.be/LJ3EFe_hyoc?t=2h14m57s)"
// 29th song: Cheap Thriills - SIA [2h21m41s](https://youtu.be/LJ3EFe_hyoc?t=2h21m41s)'
// 30th song: Waka waka - Shakira [2h25m50s](https://youtu.be/LJ3EFe_hyoc?t=2h25m50s)'
// 31th song: Fly - Nicki Minaj ft Rihanna [2h30m39s](https://youtu.be/LJ3EFe_hyoc?t=2h30m39s)'
// 32th song: Super Bass - Nicki Minaj [2h34m48s](https://youtu.be/LJ3EFe_hyoc?t=2h34m48s)'
// 33th song: Bang Bang - Ariana Grande, Jessie J, Nicki Minaj [2h39m22s](https://youtu.be/LJ3EFe_hyoc?t=2h39m22s)'
// 34th song: Smooth Criminal - Michael Jackson [2h44m24s](https://youtu.be/LJ3EFe_hyoc?t=2h44m24s)'
// 35th song: Hymn for the weekend - Coldplay ft Beyonce [2h48m42s](https://youtu.be/LJ3EFe_hyoc?t=2h48m42s)',
// 36th song: Lucky - Jason Mraz ft Colbie Caillat [2h55m2s](https://youtu.be/LJ3EFe_hyoc?t=2h55m2s)'
// 37th song: Start of something new - High school Musical [2h59m44s](https://youtu.be/LJ3EFe_hyoc?t=2h59m44s)',  '38th song: Unconditionally - Katy Perry [3h4m24s](https://youtu.be/LJ3EFe_hyoc?t=3h4m24s)'
// 39th song: The edge of glory - Lady Gaga [3h9m2s](https://youtu.be/LJ3EFe_hyoc?t=3h9m2s)'
// 40th song: Photograph - Ed Sheeran [3h20m35s](https://youtu.be/LJ3EFe_hyoc?t=3h20m35s)

/*
1. Me and My Broken Heart - Rixton 4m15s
2. Someone You Loved - Lewis Capaldi 7m26s
3. Fall For You - Secondhand Serenade 12m10s
4. Starlight - Muse 15m55s
9. Bleeding love - Leona Lewis 40m41s
17. Reflection - Christina Aguilera (Mulan) 1h17m3s
18. Judas - Lady Gaga 1h18m32s
19. Bad Romance - Lady Gaga 1h24m27s
20. Shallow - Lady Gaga 1h29m22s
21. Deja Vu - Olivia Rodrigo 1h34m0s
22. Happier - Olivia Rodrigo 1h37m31s
23. Good 4 u - Olivia Rodrigo 1h42m21s
24. Hopelessly Devoted to You - Grease 1h50m46s
25. Mamma Mia - ABBA 2h1s
26. Attention - Charlie Puth 2h4m56s
27. Without You - David Guetta ft Usher 2h9m8s
28. Sweet child O'mine - Guns n Roses 2h14m57s
29. Cheap Thriills - SIA 2h21m41s
30. Waka waka - Shakira 2h25m50s
31. Fly - Nicki Minaj ft Rihanna 2h30m39s
32. Super Bass - Nicki Minaj 2h34m48s
33. Bang Bang - Ariana Grande, Jessie J, Nicki Minaj 2h39m22s
34. Smooth Criminal - Michael Jackson 2h44m24s
35. Hymn for the weekend - Coldplay ft Beyonce 2h48m42s
36. Lucky - Jason Mraz ft Colbie Caillat 2h55m2s
37. Start of something new - High school Musical 2h59m44s
38. Unconditionally - Katy Perry 3h4m24s
39. The edge of glory - Lady Gaga 3h9m2s
40. Photograph - Ed Sheeran 3h20m35s
*/
