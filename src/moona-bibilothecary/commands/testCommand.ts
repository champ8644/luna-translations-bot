import { format } from 'date-fns';
import Discord, { Collection, Message } from 'discord.js';

import { RowLines, RowMain } from '../type/local';
import { Command, CommandInterface } from './commandInterface';

export class GreetCommand extends Command implements CommandInterface {
  commandNames = ["test", "t"];

  alias(): string {
    return this.commandNames.join(" | ");
  }

  help(): string {
    return this.helpText(
      "test by posting placeholder karaoke post in the channel"
    );
  }

  async run(message: Message): Promise<void> {
    message.reply("test");
    // const channelPosting = await korotaggerInfo.getChannelPost();
    // if (!channelPosting)
    //   throw "There is no current set channel to post karaoke.";
    // const embed = new Discord.MessageEmbed()
    //   .setColor("#1DA1F2")
    //   .setTitle(`[Archive] MoonASpace`)
    //   .setURL("https://twitter.com/moonahoshinova")
    //   .setImage(
    //     "https://cdn.discordapp.com/attachments/889464199565172776/908299482272235560/Screenshot_2021-11-11_171643.png"
    //   )
    //   .setFooter(`🐦 Twitter ⛔ Unarchived 🔮 Public`);
    // const reply = await channelPosting.send({
    //   embeds: [embed],
    // });
    // await reply.startThread({
    //   name: "MoonASpace Archive",
    //   autoArchiveDuration: 4320,
    // });
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
          "🚀 ~ file: KoroTaggerCommand.ts ~ line 71 ~ KoroTaggerCommand ~ onKoroMessage ~ resMain",
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
    const output: { main?: RowMain; description: Array<RowLines> } = {
      description: [],
    };
    for (const [key, value] of messages.entries()) {
      const res = await this.parseEachMessage(value);
      if (!res) return output;
      const { main, description } = res;
      if (main && output.main) return output;
      output.main = main;
      output.description = [...description, ...output.description];
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

  // const publishedDate = new Date(yt.publishedAt);
  // const reply = await message.channel.send({
  //   embeds: [
  //     buildEmbedPost({
  //       title: yt.title,
  //       streamLink: "https://youtu.be/" + yt.id,
  //       isArchive: yt.isArchive,
  //       isKaraoke: yt.isKaraoke,
  //       isMoona: yt.isMoona!,
  //       imageLink: yt.thumbnailUrl,
  //       description: yt.description,
  //       publishedDate,
  //     }),
  //   ],
  // });
  // reply.startThread({
  //   name:
  //     "MoonUtau " +
  //     (yt.isArchive ? "Archive" : "Unarchive") +
  //     " - " +
  //     format(publishedDate, "d MMM yyyy"),
  //   autoArchiveDuration: DEV ? 1440 : 4320,
  // });
}
