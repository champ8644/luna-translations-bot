import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { Command, createEmbedMessage, reply, send } from '../../helpers/discord';
import { getStartTime, VideoId } from '../../modules/holodex/frames';
import { filterAndStringifyHistory, getRelayHistory } from '../db/functions';
import { RelayedComment } from '../db/models/RelayedComment';

const description = 'Posts the archived relay log for a given video ID.';

export const log: Command = {
  config: {
    permLevel: 0,
  },
  help: {
    category: 'Relay',
    description,
  },
  slash: new SlashCommandBuilder()
    .setName('log')
    .setDescription(description)
    .addStringOption((option) =>
      option.setName('videoid').setDescription('Video ID').setRequired(true),
    ),
  callback: async (intr: CommandInteraction) => {
    const videoId = intr.options.getString('videoid')!;
    const history = await getRelayHistory(videoId);
    const processMsg = !history ? notifyLogNotFound : sendLog;

    processMsg(intr, videoId!, history!);
  },
};

function notifyLogNotFound(intr: CommandInteraction, videoId: VideoId): void {
  reply(intr, createEmbedMessage(`Log not found for ${videoId}`));
}

async function sendLog(
  intr: CommandInteraction,
  videoId: VideoId,
  history: RelayedComment[],
): Promise<void> {
  const start = await getStartTime(videoId);
  const tlLog = await filterAndStringifyHistory(intr, history, start);
  send(intr.channel!, {
    content: `Here is the TL log for <https://youtu.be/${videoId}>`,
    files: [{ attachment: Buffer.from(tlLog), name: `${videoId}.txt` }],
  });
}
