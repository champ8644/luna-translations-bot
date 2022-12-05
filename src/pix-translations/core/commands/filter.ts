import { SlashCommandBuilder } from '@discordjs/builders';
import { oneLine } from 'common-tags';
import { CommandInteraction, EmbedFieldData } from 'discord.js';

import { Command, createEmbed, reply } from '../../helpers/discord';
import { getSettings, updateGuildSettings } from '../db/functions';
import { GuildSettings } from '../db/models';

const description = 'Manage custom-banned strings and custom-desired strings.';

export const filter: Command = {
  config: {
    permLevel: 1,
  },
  help: {
    category: 'Relay',
    description: 'Manage custom-banned strings and custom-desired strings.',
  },
  slash: new SlashCommandBuilder()
    .setName('filter')
    .setDescription(description)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('add pattern to pattern-blacklist')
        .addStringOption((option) =>
          option.setName('pattern').setDescription('pattern').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('remove pattern from pattern-blacklist')
        .addStringOption((option) =>
          option.setName('pattern').setDescription('pattern').setRequired(true),
        ),
    ),
  callback: async (intr: CommandInteraction): Promise<void> => {
    const str = intr.options.getString('pattern')!;
    const g = await getSettings(intr);
    const feature = 'customBannedPatterns';
    const current = g[feature];
    const verb = intr.options.getSubcommand(true) as 'add' | 'remove';
    const isPatternValid =
      verb === 'add' ? current.every((s) => s !== str) : current.find((s) => s === str);
    const modifyIfValid = isPatternValid ? modifyList : notifyInvalidPattern;

    modifyIfValid({
      intr,
      type: 'blacklist',
      verb,
      pattern: str,
      g,
    });
  },
};

///////////////////////////////////////////////////////////////////////////////

const validLists = ['blacklist', 'whitelist'] as const;
const validVerbs = ['add', 'remove'] as const;
type ValidList = typeof validLists[number];
type ValidVerb = typeof validVerbs[number];

interface ModifyPatternListOptions {
  intr: CommandInteraction;
  type: ValidList;
  verb: ValidVerb;
  pattern: string;
  g: GuildSettings;
}

async function modifyList(opts: ModifyPatternListOptions): Promise<void> {
  const feature = opts.type === 'blacklist' ? 'customBannedPatterns' : 'customWantedPatterns';
  const current = opts.g[feature];
  const edited =
    opts.verb === 'add' ? [...current, opts.pattern] : current.filter((s) => s !== opts.pattern);

  await updateGuildSettings(opts.intr, { [feature]: edited });

  reply(
    opts.intr,
    createEmbed({
      fields: [
        {
          name: 'Success',
          value: oneLine`
      ${opts.pattern} was ${opts.verb === 'add' ? 'added to' : 'removed from'}
      the ${opts.type}.
    `,
        },
        ...createListFields(
          opts.type === 'whitelist' ? edited : opts.g.customWantedPatterns,
          opts.type === 'blacklist' ? edited : opts.g.customBannedPatterns,
        ),
      ],
    }),
  );
}

function notifyInvalidPattern(opts: ModifyPatternListOptions): void {
  reply(
    opts.intr,
    createEmbed({
      fields: [
        {
          name: 'Failure',
          value: oneLine`
      ${opts.pattern} was ${opts.verb === 'add' ? 'already' : 'not found'}
      in the ${opts.type}.
    `,
        },
        ...createListFields(opts.g.customWantedPatterns, opts.g.customBannedPatterns),
      ],
    }),
  );
}

function createListFields(whitelist: string[], blacklist: string[]): EmbedFieldData[] {
  return [
    {
      name: 'Current whitelist',
      value: whitelist.join(', ') || '*Nothing yet*',
      inline: false,
    },
    {
      name: 'Current blacklist',
      value: blacklist.join(', ') || '*Nothing yet*',
      inline: false,
    },
  ];
}
