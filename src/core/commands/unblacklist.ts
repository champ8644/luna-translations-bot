import { SlashCommandBuilder } from '@discordjs/builders';
import { oneLine } from 'common-tags';
import { CommandInteraction } from 'discord.js';
import { init, isNil, last } from 'ramda';

import { Command, createEmbedMessage, reply } from '../../helpers/discord';
import { getSettings, removeBlacklisted, updateGuildSettings } from '../db/functions';

const description =
  'Unblacklists the specified channel ID.  If none specified, unblacklists last item.';

export const unblacklist: Command = {
  config: {
    permLevel: 1,
  },
  help: {
    category: 'Relay',
    description,
  },
  slash: new SlashCommandBuilder()
    .setName('unblacklist')
    .setDescription(description)
    .addStringOption((option) => option.setName('ytchannelid').setDescription('YT Channel ID')),
  callback: (intr: CommandInteraction): void => {
    const ytChannel = intr.options.getString('ytchannelid');
    const processMsg = isNil(ytChannel) ? unblacklistLastItem : unblacklistItem;
    processMsg(intr, ytChannel!);
  },
};

///////////////////////////////////////////////////////////////////////////////

async function unblacklistLastItem(intr: CommandInteraction): Promise<void> {
  const { blacklist } = await getSettings(intr);
  const lastBlacklisted = last(blacklist);
  const replyContent = lastBlacklisted
    ? oneLine`
      :white_check_mark: Successfully unblacklisted channel
      ${lastBlacklisted.ytId} (${lastBlacklisted.name}).
    `
    : ':warning: No items in blacklist.';

  reply(intr, createEmbedMessage(replyContent));
  if (lastBlacklisted) await updateGuildSettings(intr, { blacklist: init(blacklist) });
}

async function unblacklistItem(intr: CommandInteraction, ytId: string): Promise<void> {
  const success = await removeBlacklisted(intr.guild!, ytId);
  reply(
    intr,
    createEmbedMessage(
      success
        ? `:white_check_mark: Successfully unblacklisted ${ytId}.`
        : `:warning: YouTube channel ID ${ytId} was not found.`,
    ),
  );
}
