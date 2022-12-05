import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

import { Command, createTxtEmbed, reply } from '../../helpers/discord';
import { getSettings } from '../db/functions';

const description = 'Shows blacklist';

export const viewblacklist: Command = {
  config: {
    permLevel: 1,
  },
  help: {
    category: 'Relay',
    description,
  },
  slash: new SlashCommandBuilder().setName('viewblacklist').setDescription(description),
  callback: async (intr: CommandInteraction): Promise<void> => {
    showBlacklist(intr);
  },
};

//////////////////////////////////////////////////////////////////////////////

async function showBlacklist(intr: CommandInteraction): Promise<void> {
  const g = await getSettings(intr);
  const header = 'Channel ID               | Name (Reason)\n';
  const entries = g.blacklist.map((e) => `${e.ytId} | ${e.name} (${e.reason})`).join('\n');
  const list = header + entries;

  reply(intr, undefined, '', createTxtEmbed('blacklist.txt', list));
}
