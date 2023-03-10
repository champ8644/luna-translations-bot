/* eslint-disable no-async-promise-executor */
import { addMilliseconds, getUnixTime } from 'date-fns';
import { Message } from 'discord.js';

import client from '../client';
import config from '../config/botConfig';
import moonaEmoji from '../config/moonaEmoji';
import LineComponent from '../utils/LineComponent';
import { Command, CommandInterface } from './commandInterface';
import { embedAdder } from './embedCreator';

export class AddCommand extends Command implements CommandInterface {
  commandNames = ['add', 'a'];
  args = [
    {
      name: 'line No.',
      type: 'number | number.number - (Where the latter number is ss_ eg. song 10 (ss 2))',
      description: 'Number of line that you want to edit',
    },
  ];
  timeLimit = config.timeLimit;

  help(): string {
    return this.helpText('Insert a line from Moona-Librarian Post at line');
  }

  async getSongSeasonNumber(originalMessage: Message, args: Array<string>) {
    const ID = originalMessage.id;
    const [, ...others] = args;
    const songNumberText = others.join();
    if (!ID) throw "Please specify post's ID.";
    if (!songNumberText) throw 'Please specify song number.';
    const res1 = /^\s*(\d+)(?:\.(\d+))?\s*$/.exec(songNumberText);
    if (res1) {
      // Pattern of song numbers
      const [, songNumberStr, seasonNumberStr] = res1;
      const songNumber = Number(songNumberStr);
      let seasonNumber: number | undefined;
      if (!seasonNumberStr || Number(seasonNumberStr) === 1) seasonNumber = undefined;
      else seasonNumber = Number(seasonNumberStr);
      if (Number.isNaN(songNumber) || songNumber <= 0) throw 'Invalid song number.';
      if (seasonNumber && (Number.isNaN(seasonNumber) || seasonNumber <= 0))
        throw 'Invalid season number.';
      if (!songNumber)
        throw `Invalid song number format\n\tplease use "1" for 1st song or "1.2" for 1st song (ss2)`;
      if (originalMessage.author.id !== client.application?.id) throw `I can only edit my post.`;
      if (!originalMessage.embeds.length) throw 'Invalid post: no embed detected';
      return { songNumber, seasonNumber, type: 'full' };
    }
    throw `Error parsing ${songNumberText}`;
  }

  findLowerBound(lines: Array<LineComponent>, songNumber: number, seasonNumber = 1) {
    for (let i = 0; i < lines.length; i++) {
      if (songNumber === lines[i].songNumber) {
        const lineSeasonNumber = lines[i].seasonNumber || 1;
        if (seasonNumber <= lineSeasonNumber) return i;
      } else if (songNumber < lines[i].songNumber) return i;
    }
    return lines.length;
  }

  async getEmbedEditor(originalMessage: Message, songNumber: number, seasonNumber?: number) {
    const { description, url } = originalMessage.embeds[0];
    const lines: Array<LineComponent> = [];
    description?.split(/\n/g).forEach((line) => {
      const res = new LineComponent(line);
      if (!res.isValid) return;
      lines.push(res);
    });

    const foundIdx = this.findLowerBound(lines, songNumber, seasonNumber);
    const found = lines[foundIdx] ? lines[foundIdx] : new LineComponent();
    const beforeFound = lines[foundIdx - 1] ? lines[foundIdx - 1] : new LineComponent();

    return { lines, foundIdx, beforeFound, found, url: url || undefined };
  }

  async disposeMessage(indexMesssage: Message, num: number) {
    let i = num;
    let currentMessage = indexMesssage;
    while (i > 0 && currentMessage.reference?.messageId) {
      const parentMessage = await currentMessage.fetchReference();
      if (currentMessage.deletable && !currentMessage.hasThread) await currentMessage.delete();
      currentMessage = parentMessage;
      i--;
    }
  }

  awaitReply(
    message: Message,
    beforeLine: LineComponent,
    line: LineComponent,
  ): Promise<Message | undefined> {
    return new Promise(async (resolve, reject) => {
      try {
        const messageReply = await message.reply(
          `Reply to this message with the message to edit, or press ${
            moonaEmoji.denied
          } to cancel\n> Pattern: "New line content" | "New line content" "timestamp" - (Where "timestamp" is \\_h\\_m\\_s)\n\`\`\`${beforeLine.toDisplay()}\n> ...\n${line.toDisplay()}\`\`\`(This message will be deleted automatically <t:${getUnixTime(
            addMilliseconds(new Date(), this.timeLimit),
          )}:R>)`,
        );

        // Reaction Collector
        const reactionCollector = messageReply.createReactionCollector({
          filter: (reaction, user) =>
            reaction.emoji.name === moonaEmoji.string.denied && user.id === message.author.id,
          time: this.timeLimit,
        });
        // Message Collector
        const messageCollector = messageReply.channel.createMessageCollector({
          filter: (messageAnswerReply) => messageAnswerReply.author.id === message.author.id,
          time: this.timeLimit,
        });

        reactionCollector.on('collect', () => {
          reactionCollector.stop('cancel');
        });
        reactionCollector.on('end', async (collected, reason) => {
          if (reason === 'accept') {
            const [, , ...newMsg] = messageReply.content.split(/\n/g);
            const [lastMsg] = newMsg[newMsg.length - 1].split(
              '(This message will be deleted automatically',
            );
            const finalMsg = [...newMsg.slice(0, -1), lastMsg].join('\n');
            if (messageReply.editable) messageReply.edit(finalMsg);
            await messageReply.reactions.removeAll();
          } else {
            this.disposeMessage(messageReply, 2);
            messageCollector.stop('cancel');
            resolve(undefined);
          }
        });

        messageCollector.on('collect', (messageAnswerReply) => {
          if (messageAnswerReply.reference?.messageId === messageReply.id) {
            // If there is a reply to current message
            resolve(messageAnswerReply);
            messageCollector.stop('accept');
            reactionCollector.stop('accept');
          } else {
            // There is no reply, must be an accident, proceed to delete the message
            if (messageAnswerReply.deletable) messageAnswerReply.delete();
          }
        });
        await messageReply.react(moonaEmoji.denied);
      } catch (err) {
        reject(err);
      }
    });
  }

  async showConfirmation(
    messageAnswerReply: Message,
    originalMessage: Message,
    newLineObj: {
      url?: string;
      songNumber: number;
      seasonNumber?: number;
    },
  ): Promise<{ type: 'accept'; newLine: LineComponent } | { type: 'cancel' } | { type: 'edit' }> {
    return new Promise(async (resolve, reject) => {
      try {
        const [, addLine, addTimestamp] =
          /^(?:\d+(?:\s*\(\s*\d+\s*\)\s*)?[.\s]*)?(.*?)\s*((?:\d+h)?(?:\d+m)?\d+s)?\s*$/.exec(
            messageAnswerReply.content,
          ) || [];
        const { url, songNumber, seasonNumber } = newLineObj;

        const newLine = new LineComponent(
          {
            songNumber,
            songName: addLine,
            seasonNumber,
            timestamp: addTimestamp,
          },
          url,
        );

        const finalMessage = await messageAnswerReply.reply({
          content: `Press ${moonaEmoji.approb} for confirmation, ${moonaEmoji.denied} for cancel, ${
            moonaEmoji.edit
          } for editing again\n(This message will be deleted automatically <t:${getUnixTime(
            addMilliseconds(new Date(), this.timeLimit),
          )}:R>)`,
          embeds: [
            embedAdder({
              title: originalMessage.embeds[0].title,
              color: originalMessage.embeds[0].color,
              thumbnail: originalMessage.embeds[0].image?.url,
              url: `https://discord.com/channels/${originalMessage.guildId}/${originalMessage.channelId}/${originalMessage.id}`,
              addLine: newLine.toRaw(),
              addTimestamp,
            }),
          ],
        });
        // Reaction Collector
        const reactionCollector = finalMessage.createReactionCollector({
          filter: (reaction, user) =>
            [moonaEmoji.string.approb, moonaEmoji.string.edit, moonaEmoji.string.denied].includes(
              reaction.emoji.name || '',
            ) && user.id === messageAnswerReply.author.id,
          time: this.timeLimit,
        });
        reactionCollector.on('collect', (collected) => {
          reactionCollector.stop(collected.emoji.name || '');
        });
        reactionCollector.on('end', async (collected, reason) => {
          switch (reason) {
            case moonaEmoji.string.approb:
              this.disposeMessage(finalMessage, 4);
              resolve({ type: 'accept', newLine });
              break;
            case moonaEmoji.string.edit:
              this.disposeMessage(finalMessage, 3);
              resolve({ type: 'edit' });
              break;
            case moonaEmoji.string.denied:
            default:
              this.disposeMessage(finalMessage, 4);
              resolve({ type: 'cancel' });
          }
        });
        await finalMessage.react(moonaEmoji.approb);
        await finalMessage.react(moonaEmoji.denied);
        await finalMessage.react(moonaEmoji.edit);
      } catch (err) {
        reject(err);
      }
    });
  }

  pushSongIndex(
    lines: Array<LineComponent>,
    foundIdx: number,
    songNumber: number,
    seasonNumber?: number,
  ) {
    if (seasonNumber) {
      // push by season
      let lastPushNumber = seasonNumber;
      for (let i = foundIdx; i < lines.length; i++) {
        const line = lines[i];
        if (line.songNumber === songNumber) {
          if (line.seasonNumber === lastPushNumber) {
            line.seasonNumber++;
            lastPushNumber++;
          } else return;
        } else return;
      }
      // If it's go to this then foundIdx===lines.length
      // no push needed
    } else {
      // push by song
      let lastPushNumber = songNumber;
      for (let i = foundIdx; i < lines.length; i++) {
        const line = lines[i];
        if (line.songNumber < lastPushNumber) line.songNumber++;
        else if (line.songNumber === lastPushNumber) {
          line.songNumber++;
          lastPushNumber++;
        } else return;
      }
      // If it's go to this then foundIdx===lines.length
      // no push needed
    }
  }

  async addOriginalEmbed(payload: {
    originalMessage: Message;
    lines: Array<LineComponent>;
    foundIdx: number;
    newLine: LineComponent;
  }) {
    const { foundIdx, lines, originalMessage, newLine } = payload;

    this.pushSongIndex(lines, foundIdx, newLine.songNumber, newLine.seasonNumber);
    lines.splice(foundIdx, 0, newLine);

    const originalEmbed = originalMessage.embeds[0];

    const newDescription = lines.map((line) => line.toRaw()).join('\n');

    originalMessage.edit({
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
        const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
        // Only response to this bot's own post reply.
        if (originalMessage.author.id === client.application?.id) {
          // Find song number from args
          const { songNumber, seasonNumber } = await this.getSongSeasonNumber(
            originalMessage,
            args,
          );
          // use args to get line & embed to send into channel
          const { lines, foundIdx, found, beforeFound, url } = await this.getEmbedEditor(
            originalMessage,
            songNumber,
            seasonNumber,
          );

          let userChoice: 'accept' | 'cancel' | 'edit';
          do {
            // send message in channel
            // await message.reply({ embeds });
            // await reply from message
            const messageAnswerReply = await this.awaitReply(message, beforeFound, found);
            // User answered the edited answer, display the confirmation message

            if (messageAnswerReply) {
              const confirmedResponse = await this.showConfirmation(
                messageAnswerReply,
                originalMessage,
                { url, songNumber, seasonNumber },
              );
              userChoice = confirmedResponse.type;
              if (confirmedResponse.type === 'accept') {
                await this.addOriginalEmbed({
                  originalMessage,
                  lines,
                  foundIdx,
                  newLine: confirmedResponse.newLine,
                });
              }
            } else userChoice = 'cancel';
          } while (userChoice === 'edit');
        }
      }
    }
  }
}
