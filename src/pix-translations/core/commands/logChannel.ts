import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Snowflake } from 'discord.js';

import { Command, createEmbedMessage, reply } from '../../helpers/discord';
import { updateGuildSettings } from '../db/functions';

const description = 'Redirect TL logs to specified channel, or clear the setting.';

export const logChannel: Command = {
  config: {
    permLevel: 2,
  },
  help: {
    category: 'Relay',
    description,
  },
  slash: new SlashCommandBuilder()
    .setName('logchannel')
    .setDescription(description)
    .addChannelOption((option) => option.setName('channel').setDescription('discord channel')),
  callback: async (intr: CommandInteraction): Promise<void> => {
    const channel = intr.options.getChannel('channel');
    // const channelMention = intr.options.getChannel('channel')
    const channelId = channel?.id;
    const processMsg =
      channel == null
        ? clearSetting
        : !intr.guild?.channels?.cache.find((c) => c.id == channelId)
        ? respondInvalid
        : setLogChannel;
    processMsg(intr, channelId!);
  },
};

async function clearSetting(intr: CommandInteraction): Promise<void> {
  await updateGuildSettings(intr, { logChannel: undefined });
  reply(intr, createEmbedMessage('Logs will be posted in the relay channel.'));
}

function respondInvalid(intr: CommandInteraction): void {
  reply(intr, createEmbedMessage(`Invalid channel supplied.`));
}

async function setLogChannel(intr: CommandInteraction, channelId: Snowflake): Promise<void> {
  await updateGuildSettings(intr, { logChannel: channelId });
  reply(intr, createEmbedMessage(`Logs will be posted in <#${channelId}>.`));
}
