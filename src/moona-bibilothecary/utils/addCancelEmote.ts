/* eslint-disable no-async-promise-executor */
import { Message } from 'discord.js';

import config from '../config/botConfig';
import moonaEmoji from '../config/moonaEmoji';

export function addCancelEmote(
  message: Message,
  messageReply: Message,
  timeLimit = config.timeLimit
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await messageReply.react(moonaEmoji.denied);
      // Reaction Collector
      const reactionCollector = messageReply.createReactionCollector({
        filter: (reaction, user) =>
          reaction.emoji.name === moonaEmoji.string.denied &&
          user.id === message.author.id,
        time: timeLimit,
      });

      reactionCollector.on("collect", () => {
        reactionCollector.stop();
      });
      reactionCollector.on("end", async () => {
        if (messageReply.deletable) messageReply.delete();
        if (message.deletable) message.delete();
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}
