import { time } from 'console';
import { addMilliseconds, fromUnixTime, getUnixTime, isValid, parse } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Message, MessageEmbed } from 'discord.js';

import client from '../client';
import config from '../config/botConfig';
import moonaEmoji from '../config/moonaEmoji';
import LineComponent from '../utils/LineComponent';
import { Command, CommandInterface } from './commandInterface';
import { embedEditor } from './embedCreator';

/* eslint-disable no-async-promise-executor */
export class EditCommand extends Command implements CommandInterface {
  commandNames = ["edit", "e"];
  args = [
    {
      name: 'line No. | "date"',
      type: "number | number.number - (Where the latter number is ss_ eg. song 10 (ss 2))",
      description: "Number of line that you want to edit",
    },
  ];
  timeLimit = config.timeLimit;

  help(): string {
    return this.helpText("Edit a line from Moona-Librarian Post at line");
  }

  async getSongSeasonNumber(originalMessage: Message, args: Array<string>) {
    const ID = originalMessage.id;
    const [, songNumberText] = args;
    if (!ID) throw "Please specify post's ID.";
    if (!songNumberText) throw "Please specify song number.";
    const [, songNumberStr, seasonNumberStr] =
      /^\s*(\d+)(?:\.(\d+))?\s*$/.exec(songNumberText) || [];
    const songNumber = Number(songNumberStr);
    let seasonNumber: number | undefined;
    if (!seasonNumberStr || Number(seasonNumberStr) === 1)
      seasonNumber = undefined;
    else seasonNumber = Number(seasonNumberStr);
    if (Number.isNaN(songNumber) || songNumber <= 0)
      throw "Invalid song number.";
    if (seasonNumber && (Number.isNaN(seasonNumber) || seasonNumber <= 0))
      throw "Invalid season number.";
    if (!songNumber)
      throw `Invalid song number format\n\tplease use "1" for 1st song or "1.2" for 1st song (ss2)`;
    if (originalMessage.author.id !== client.application?.id)
      throw `I can only edit my post.`;
    if (!originalMessage.embeds.length) throw "Invalid post: no embed detected";
    return { songNumber, seasonNumber };
  }

  async getEmbedEditor(
    originalMessage: Message,
    songNumber: number,
    seasonNumber?: number
  ) {
    const { description, url } = originalMessage.embeds[0];
    const lines: Array<LineComponent> = [];
    description?.split(/\n/g).forEach((line) => {
      const res = new LineComponent(line, url || undefined);
      if (!res.isValid) return;
      lines.push(res);
    });

    const foundIdx = lines.findIndex(
      (line) =>
        songNumber === line.songNumber &&
        (!seasonNumber || seasonNumber === line.seasonNumber)
    );
    const found = lines[foundIdx];

    if (!found)
      throw (
        `Cannot find song number "${songNumber}` +
        (seasonNumber ? ` (ss ${seasonNumber})` : "") +
        '".'
      );
    return { lines, found, foundIdx };
  }

  async disposeMessage(indexMesssage: Message, num: number) {
    let i = num;
    let currentMessage = indexMesssage;
    while (i > 0 && currentMessage.reference?.messageId) {
      const parentMessage = await currentMessage.fetchReference();
      if (currentMessage.deletable && !currentMessage.hasThread)
        currentMessage.delete();
      currentMessage = parentMessage;
      i--;
    }
  }

  async awaitReplyDate(
    message: Message,
    timestamp: number | null
  ): Promise<Message | undefined> {
    const messageReply = await message.reply(
      `Reply to this message with the message to edit, or press ${
        moonaEmoji.denied
      } to cancel\n> Pattern: "timestamp" - (Where "timestamp" is epoch number)\n\`\`\`${
        timestamp ? timestamp / 1000 : "-"
      }\`\`\`\`\`\`${
        timestamp
          ? formatInTimeZone(
              fromUnixTime(timestamp / 1000),
              "Asia/Bangkok",
              "d MMM yyyy. H:mm:ss x"
            )
          : "-"
      }\`\`\`(This message will be deleted automatically <t:${getUnixTime(
        addMilliseconds(new Date(), this.timeLimit)
      )}:R>)`
    );
    return this.awaitReply(message, messageReply);
  }

  async awaitReplyLine(
    message: Message,
    found: LineComponent
  ): Promise<Message | undefined> {
    const messageReply = await message.reply(
      `Reply to this message with the message to edit, or press ${
        moonaEmoji.denied
      } to cancel\n> Pattern: "New line content" | "New line content" "timestamp" - (Where "timestamp" is \\_h\\_m\\_s)\n\`\`\`${
        found.songDisplayName
      }\`\`\`\`\`\`${
        found.timestamp
      }\`\`\`(This message will be deleted automatically <t:${getUnixTime(
        addMilliseconds(new Date(), this.timeLimit)
      )}:R>)`
    );
    return this.awaitReply(message, messageReply);
  }

  awaitReply(
    message: Message,
    messageReply: Message
  ): Promise<Message | undefined> {
    return new Promise(async (resolve, reject) => {
      try {
        // Reaction Collector
        const reactionCollector = messageReply.createReactionCollector({
          filter: (reaction, user) =>
            reaction.emoji.name === moonaEmoji.string.denied &&
            user.id === message.author.id,
          time: this.timeLimit,
        });
        // Message Collector
        const messageCollector = messageReply.channel.createMessageCollector({
          filter: (messageAnswerReply) =>
            messageAnswerReply.author.id === message.author.id,
          time: this.timeLimit,
        });

        reactionCollector.on("collect", () => {
          reactionCollector.stop("cancel");
        });
        reactionCollector.on("end", async (collected, reason) => {
          if (reason === "accept") {
            const newMsg = messageReply.content.split(/\n/g)[2];
            if (messageReply.editable) messageReply.edit(newMsg);
            await messageReply.reactions.removeAll();
          } else {
            this.disposeMessage(messageReply, 2);
            messageCollector.stop("cancel");
            resolve(undefined);
          }
        });

        messageCollector.on("collect", (messageAnswerReply) => {
          if (messageAnswerReply.reference?.messageId === messageReply.id) {
            // If there is a reply to current message
            resolve(messageAnswerReply);
            messageCollector.stop("accept");
            reactionCollector.stop("accept");
          } else {
            // There is no reply, must be an accident, proceed to delete the message
            if (messageAnswerReply.deletable) messageAnswerReply.delete();
          }
        });
        if (!messageReply.deleted) await messageReply.react(moonaEmoji.denied);
      } catch (err) {
        reject(err);
      }
    });
  }

  parseConfirmationDate(content: string) {
    if (!Number.isNaN(Number(content))) return Number(content);
    const parsedDate = parse(content, "d MMM yyyy. H:mm:ss x", new Date());
    if (isValid(parsedDate)) return getUnixTime(parsedDate);
    return null;
  }

  showConfirmationDate(
    messageAnswerReply: Message,
    originalMessage: Message,
    timestamp: number | null
  ): Promise<
    { type: "accept"; output: number } | { type: "cancel" } | { type: "edit" }
  > {
    const newTimestamp = this.parseConfirmationDate(messageAnswerReply.content);

    if (newTimestamp === null) {
      this.disposeMessage(messageAnswerReply, 2);
      return new Promise((res) => res({ type: "edit" }));
    }

    const newEmbed = embedEditor({
      title: originalMessage.embeds[0].title,
      color: originalMessage.embeds[0].color,
      thumbnail: originalMessage.embeds[0].image?.url,
      url: `https://discord.com/channels/${originalMessage.guildId}/${originalMessage.channelId}/${originalMessage.id}`,
      originalLine:
        timestamp !== null
          ? formatInTimeZone(
              fromUnixTime(timestamp / 1000),
              "Asia/Bangkok",
              "iii, d MMM yyyy. H:mm:ss zzz"
            )
          : "-",
      originalTimestamp: timestamp !== null ? "" + timestamp / 1000 : "-",
      editedLine:
        newTimestamp !== null
          ? formatInTimeZone(
              fromUnixTime(newTimestamp),
              "Asia/Bangkok",
              "iii, d MMM yyyy. H:mm:ss zzz"
            )
          : "-",
      editedTimestamp: "" + newTimestamp,
    });

    return this.showConfirmation(messageAnswerReply, newEmbed, newTimestamp);
  }

  showConfirmationLine(
    messageAnswerReply: Message,
    originalMessage: Message,
    found: LineComponent
  ): Promise<
    | { type: "accept"; output: LineComponent }
    | { type: "cancel" }
    | { type: "edit" }
  > {
    const [, editedLine, editedTimestamp] =
      /^(?:\d+(?:\s*\(\s*\d+\s*\)\s*)?[.\s]*)?(.*?)\s*((?:\d+h)?(?:\d+m)?\d+s)?\s*$/.exec(
        messageAnswerReply.content
      ) || "";

    const newLine = found.replace({
      songName: editedLine,
      timestamp: editedTimestamp,
    });

    const newEmbed = embedEditor({
      title: originalMessage.embeds[0].title,
      color: originalMessage.embeds[0].color,
      thumbnail: originalMessage.embeds[0].image?.url,
      url: `https://discord.com/channels/${originalMessage.guildId}/${originalMessage.channelId}/${originalMessage.id}`,
      originalLine: found.toShortDisplay(),
      originalTimestamp: found.timestamp,
      editedLine: newLine.toShortDisplay(),
      editedTimestamp,
    });

    return this.showConfirmation(messageAnswerReply, newEmbed, newLine);
  }

  async showConfirmation<T extends LineComponent | number | null>(
    messageAnswerReply: Message,
    newEmbed: MessageEmbed,
    output: T
  ): Promise<
    { type: "accept"; output: T } | { type: "cancel" } | { type: "edit" }
  > {
    return new Promise(async (resolve, reject) => {
      try {
        const finalMessage = await messageAnswerReply.reply({
          content: `Press ${moonaEmoji.approb} for confirmation, ${
            moonaEmoji.denied
          } for cancel, ${
            moonaEmoji.edit
          } for editing again\n(This message will be deleted automatically <t:${getUnixTime(
            addMilliseconds(new Date(), this.timeLimit)
          )}:R>)`,
          embeds: [newEmbed],
        });
        // Reaction Collector
        const reactionCollector = finalMessage.createReactionCollector({
          filter: (reaction, user) =>
            [
              moonaEmoji.string.approb,
              moonaEmoji.string.edit,
              moonaEmoji.string.denied,
            ].includes(reaction.emoji.name || "") &&
            user.id === messageAnswerReply.author.id,
          time: this.timeLimit,
        });
        reactionCollector.on("collect", (collected) => {
          reactionCollector.stop(collected.emoji.name || "");
        });
        reactionCollector.on("end", async (collected, reason) => {
          switch (reason) {
            case moonaEmoji.string.approb:
              this.disposeMessage(finalMessage, 4);
              resolve({ type: "accept", output });
              break;
            case moonaEmoji.string.edit:
              this.disposeMessage(finalMessage, 3);
              resolve({ type: "edit" });
              break;
            case moonaEmoji.string.denied:
            default:
              this.disposeMessage(finalMessage, 4);
              resolve({ type: "cancel" });
          }
        });
        if (!finalMessage.deleted) await finalMessage.react(moonaEmoji.approb);
        if (!finalMessage.deleted) await finalMessage.react(moonaEmoji.denied);
        if (!finalMessage.deleted) await finalMessage.react(moonaEmoji.edit);
      } catch (err) {
        reject(err);
      }
    });
  }

  async editOriginalEmbedDate(payload: {
    originalMessage: Message;
    timestamp: number;
  }) {
    const { timestamp, originalMessage } = payload;
    const fetchedOriginalMessage = await originalMessage.fetch();
    const newEmbed = fetchedOriginalMessage.embeds[0];

    newEmbed.setTimestamp(fromUnixTime(timestamp));
    const oldAuthor = newEmbed.author?.name || "";
    const res = /(.*)\s+(\d{1,2}\/\d{1,2}\/\d{1,2})/.exec(oldAuthor);

    if (res) {
      const [, prefix, oldDate] = res;
      const finalAuthor =
        prefix +
        " " +
        formatInTimeZone(fromUnixTime(timestamp), "Asia/Bangkok", "dd/MM/yy");

      newEmbed.setAuthor(finalAuthor);
    }

    await fetchedOriginalMessage.edit({
      embeds: [newEmbed],
    });

    if (fetchedOriginalMessage.hasThread) {
      const threadName = fetchedOriginalMessage.thread?.name;
      const [prefixThread, suffixThread] = threadName?.split(" - ") || [];
      if (!suffixThread || !fetchedOriginalMessage.thread) return;
      const { thread } = fetchedOriginalMessage;
      const isArchived = thread.archived;
      if (isArchived) await fetchedOriginalMessage.thread.setArchived(false);
      await fetchedOriginalMessage.thread.setName(
        prefixThread +
          " - " +
          formatInTimeZone(
            fromUnixTime(timestamp),
            "Asia/Bangkok",
            "dd MMM yyyy"
          )
      );
      if (isArchived) await fetchedOriginalMessage.thread.setArchived(true);
    }
  }

  async editOriginalEmbedLine(payload: {
    originalMessage: Message;
    newLine: LineComponent;
    lines: Array<LineComponent>;
    foundIdx: number;
  }) {
    const { foundIdx, lines, newLine, originalMessage } = payload;
    const fetchedOriginalMessage = await originalMessage.fetch();
    const originalEmbed = fetchedOriginalMessage.embeds[0];

    const newDescription = lines
      .map((line, idx) => {
        if (idx === foundIdx) {
          return newLine.toRaw();
        } else return line.toRaw();
      })
      .join("\n");

    await fetchedOriginalMessage.edit({
      embeds: [originalEmbed.setDescription(newDescription)],
    });
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    if (message.reference) {
      if (
        message.channelId === message.reference.channelId &&
        message.guildId === message.reference.guildId &&
        message.reference.messageId
      ) {
        const originalMessage = await message.channel.messages.fetch(
          message.reference.messageId
        );
        // Only response to this bot's own post reply.
        if (originalMessage.author.id === client.application?.id) {
          // Check if want to edit post instead
          const [, typeEditing] = args;

          switch (typeEditing) {
            case "date": {
              const { embeds } = originalMessage;
              const { timestamp } = embeds[0];
              let userChoice: "accept" | "cancel" | "edit" = "edit";
              do {
                // send message in channel
                // await message.reply({ embeds });
                // await reply from message

                const messageAnswerReply = await this.awaitReplyDate(
                  message,
                  timestamp
                );
                // User answered the edited answer, display the confirmation message
                if (messageAnswerReply) {
                  const confirmedResponse = await this.showConfirmationDate(
                    messageAnswerReply,
                    originalMessage,
                    timestamp
                  );
                  userChoice = confirmedResponse.type;
                  if (confirmedResponse.type === "accept")
                    await this.editOriginalEmbedDate({
                      originalMessage,
                      timestamp: confirmedResponse.output,
                    });
                } else userChoice = "cancel";
              } while (userChoice === "edit");
              break;
            }
            default: {
              // Find song number from args
              const { songNumber, seasonNumber } =
                await this.getSongSeasonNumber(originalMessage, args);
              // use args to get line & embed to send into channel
              const { found, lines, foundIdx } = await this.getEmbedEditor(
                originalMessage,
                songNumber,
                seasonNumber
              );

              let userChoice: "accept" | "cancel" | "edit";
              do {
                // send message in channel
                // await message.reply({ embeds });
                // await reply from message
                const messageAnswerReply = await this.awaitReplyLine(
                  message,
                  found
                );
                // User answered the edited answer, display the confirmation message
                if (messageAnswerReply) {
                  const confirmedResponse = await this.showConfirmationLine(
                    messageAnswerReply,
                    originalMessage,
                    found
                  );
                  userChoice = confirmedResponse.type;
                  if (confirmedResponse.type === "accept")
                    await this.editOriginalEmbedLine({
                      originalMessage,
                      newLine: confirmedResponse.output,
                      lines,
                      foundIdx,
                    });
                } else userChoice = "cancel";
              } while (userChoice === "edit");
            }
          }
        }
      }
    }
  }
}
