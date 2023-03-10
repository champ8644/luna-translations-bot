/* eslint-disable no-async-promise-executor */
import { addMilliseconds, getUnixTime } from 'date-fns';
import { Message } from 'discord.js';

import client from '../client';
import config from '../config/botConfig';
import moonaEmoji from '../config/moonaEmoji';
import LineComponent from '../utils/LineComponent';
import { Command, CommandInterface } from './commandInterface';
import { embedDeletor } from './embedCreator';

export class DeleteCommand extends Command implements CommandInterface {
  commandNames = ['delete', 'd'];
  args = [
    {
      name: 'line No.',
      type: 'number | number.number - (Where the latter number is ss_ eg. song 10 (ss 2))',
      description: 'Number of line that you want to edit',
    },
    {
      name: 'freeze | f',
      description: "append 'freeze' to command to not shift the song number up",
    },
  ];
  timeLimit = config.timeLimit;

  help(): string {
    return this.helpText(
      "Remove a line from Moona-Librarian Post at line, append 'freeze' to not shift the song number up",
    );
  }

  async getSongSeasonNumber(originalMessage: Message, args: Array<string>) {
    const ID = originalMessage.id;
    const [, songNumberText, isFreezeText] = args;
    const isShift = isFreezeText
      ? isFreezeText.toLowerCase() !== 'freeze' && isFreezeText.toLowerCase() !== 'f'
      : true;
    if (!ID) throw "Please specify post's ID.";
    if (!songNumberText) throw 'Please specify song number.';
    const [, songNumberStr, seasonNumberStr] =
      /^\s*(\d+)(?:\.(\d+))?\s*$/.exec(songNumberText) || [];
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
    return { songNumber, seasonNumber, isShift };
  }

  async getEmbedEditor(originalMessage: Message, songNumber: number, seasonNumber?: number) {
    const { description } = originalMessage.embeds[0];
    const lines: Array<LineComponent> = [];
    description?.split(/\n/g).forEach((line) => {
      const res = new LineComponent(line);
      if (!res.isValid) return;
      lines.push(res);
    });

    const foundIdx = lines.findIndex(
      (line) =>
        songNumber === line.songNumber && (!seasonNumber || seasonNumber === line.seasonNumber),
    );
    const found = lines[foundIdx];

    if (!found)
      throw (
        `Cannot find song number "${songNumber}` +
        (seasonNumber ? ` (ss ${seasonNumber})` : '') +
        '".'
      );
    return { lines, found, foundIdx };
  }

  async disposeMessage(indexMesssage: Message, num: number) {
    let i = num;
    let currentMessage = indexMesssage;
    while (i > 0 && currentMessage.reference?.messageId) {
      const parentMessage = await currentMessage.fetchReference();
      if (currentMessage.deletable && !currentMessage.hasThread) currentMessage.delete();
      currentMessage = parentMessage;
      i--;
    }
  }

  async showConfirmation(
    message: Message,
    originalMessage: Message,
    found: LineComponent,
    isShift: boolean,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const finalMessage = await message.reply({
          content: `Press ${moonaEmoji.approb} for confirmation, ${
            moonaEmoji.denied
          } for cancel\n(This message will be deleted automatically <t:${getUnixTime(
            addMilliseconds(new Date(), this.timeLimit),
          )}:R>)`,
          embeds: [
            embedDeletor({
              title: originalMessage.embeds[0].title,
              color: originalMessage.embeds[0].color,
              thumbnail: originalMessage.embeds[0].image?.url,
              url: `https://discord.com/channels/${originalMessage.guildId}/${originalMessage.channelId}/${originalMessage.id}`,
              originalLine: found.toShortDisplay(),
              isShift,
            }),
          ],
        });
        // Reaction Collector
        const reactionCollector = finalMessage.createReactionCollector({
          filter: (reaction, user) =>
            [moonaEmoji.string.approb, moonaEmoji.string.denied].includes(
              reaction.emoji.name || '',
            ) && user.id === message.author.id,
          time: config.timeLimit,
        });
        reactionCollector.on('collect', (collected) => {
          reactionCollector.stop(collected.emoji.name || '');
        });
        reactionCollector.on('end', async (collected, reason) => {
          switch (reason) {
            case moonaEmoji.string.approb:
              this.disposeMessage(finalMessage, 4);
              resolve('accept');
              break;
            case moonaEmoji.string.denied:
            default:
              this.disposeMessage(finalMessage, 4);
              resolve('cancel');
          }
        });
        await finalMessage.react(moonaEmoji.approb);
        await finalMessage.react(moonaEmoji.denied);
      } catch (err) {
        reject(err);
      }
    });
  }

  async deleteOriginalEmbed(payload: {
    originalMessage: Message;
    lines: Array<LineComponent>;
    foundIdx: number;
    isShift: boolean;
    found: LineComponent;
  }) {
    const { foundIdx, lines, isShift, originalMessage, found } = payload;
    const originalEmbed = originalMessage.embeds[0];

    const foundCount = lines.reduce(
      (state, next) => (next.songNumber === found.songNumber ? state + 1 : state),
      0,
    );
    const shiftModeSeason = foundCount > 1;
    const foundSeasonNumber = found.seasonNumber || 1;
    if (isShift) {
      if (shiftModeSeason) {
        // shift inside season
        lines.forEach((line) => {
          if (line.songNumber === found.songNumber) {
            // same song number but season number is greater
            if (line.seasonNumber) if (line.seasonNumber > foundSeasonNumber) line.seasonNumber--;
          }
        });
      } else {
        // shift outside season
        lines.forEach((line) => {
          if (line.songNumber > found.songNumber) {
            line.songNumber--;
          }
        });
      }
    }

    const newDescription = lines
      .filter((line, idx) => idx !== foundIdx)
      .map((line) => line.toRaw())
      .join('\n');

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
          const { songNumber, seasonNumber, isShift } = await this.getSongSeasonNumber(
            originalMessage,
            args,
          );
          // use args to get line & embed to send into channel
          const { found, lines, foundIdx } = await this.getEmbedEditor(
            originalMessage,
            songNumber,
            seasonNumber,
          );

          const confirmedResponse = await this.showConfirmation(
            message,
            originalMessage,
            found,
            isShift,
          );

          if (confirmedResponse === 'accept')
            await this.deleteOriginalEmbed({
              originalMessage,
              lines,
              foundIdx,
              isShift,
              found,
            });
        }
      }
    }
  }
}
