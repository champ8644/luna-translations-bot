import { SlashCommandBuilder } from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import { CommandInteraction, EmbedField, GuildMember } from 'discord.js';
import { Map, Set } from 'immutable';
import { head, isEmpty } from 'ramda';

import { config } from '../../config';
import { Command, createEmbed, emoji, reply } from '../../helpers/discord';
import { toTitleCase } from '../../helpers/language';
import { getPermLevel, getSettings } from '../db/functions';
import { GuildSettings, WatchFeature, WatchFeatureSettings } from '../db/models';

const { commands } = require('../lunaBotClient');

const description =
  'Displays available commands for your permission level in the requested category.';

export const tlhelp: Command = {
  config: {
    permLevel: 0,
  },
  help: {
    category: 'General',
    description,
  },
  slash: new SlashCommandBuilder()
    .setName('tlhelp')
    .setDescription(description)
    .addStringOption((option) => option.setName('category').setDescription('category')),
  callback: async (intr: CommandInteraction) => {
    const askedCategory = intr.options.getString('category') ?? '';
    const commands = await getCommandsAtUserLevel(intr);
    const categories = getCategoriesOfCommands(commands);
    const settings = await getSettings(intr);
    const helpToShow = categories.includes(toTitleCase(askedCategory))
      ? getCategoryHelp(toTitleCase(askedCategory))
      : getMainHelp(categories, settings);

    reply(intr, helpToShow);
  },
};

///////////////////////////////////////////////////////////////////////////////

async function getCommandsAtUserLevel(intr: CommandInteraction) {
  const authorLevel = await getPermLevel(intr.member as GuildMember);
  return commands.filter((x) => x.config.permLevel <= authorLevel.level);
}

function getCategoriesOfCommands(commands: Map<string, Command>): Set<string> {
  return commands
    .map((cmd) => cmd.help.category)
    .toSet()
    .filter((cat) => cat !== 'System');
}

function getCategoryHelp(category: string) {
  const fields = commands
    .filter((cmd) => cmd.help.category === category)
    .map((cmd, name) => ({
      name,
      value: cmd.help.description,
      inline: false,
    }))
    .toList() // discards keys
    .toArray()
    .sort((fa, fb) => fa.name.localeCompare(fb.name));

  return createEmbed({ fields });
}

function getMainHelp(categories: Set<string>, settings: GuildSettings) {
  return createEmbed(
    {
      description: ':candy: I am the Cutest Genius Sexy Beautiful Professor! :candy:',
      fields: [
        ...getCategoryFields(categories),
        getSettingsField(settings),
        getBotManagerField(settings),
      ],
    },
    true,
  );
}

function getCategoryFields(categories: Set<string>): Set<EmbedField> {
  return categories.map((category) => ({
    name: category,
    value: `/tlhelp [category: ${category.toLowerCase()}]`,
    inline: true,
  }));
}

function getSettingsField({
  relay,
  gossip,
  cameos,
  community,
  youtube,
  twitcasting,
}: GuildSettings): EmbedField {
  return {
    name: 'Current settings',
    inline: false,
    value: stripIndents`
      :speech_balloon: **Translation relay:** ${getWatchList('relay', relay)}
      ${emoji.pixela} **Live chat cameos:** ${getWatchList('cameos', cameos)}
      ${emoji.peek} **Gossip:** ${getWatchList('gossip', gossip)}
      :family_mmbb: **Community posts:** ${getWatchList('community', community)}
      ${emoji.yt} **YouTube lives:** ${getWatchList('youtube', youtube)}
      ${emoji.tc} **TwitCasting lives:** ${getWatchList('twitcasting', twitcasting)}
    `,
  };
}

function getBotManagerField(settings: GuildSettings): EmbedField {
  return {
    name: 'Bot managers',
    inline: false,
    value: `
      :tools: **Admins:** ${getRoleList('admins', settings)}
      :no_entry: **Blacklisters:** ${getRoleList('blacklisters', settings)}
    `,
  };
}

function getWatchList(feature: WatchFeature, entries: WatchFeatureSettings[]): string {
  const first = head(entries);
  const firstMention = first?.roleToNotify ? `mentioning <@&${first.roleToNotify}>` : '';
  const templates = {
    empty: `None. Run \`${config.prefix}${feature}\``,
    one: `${first?.streamer} in <#${first?.discordCh}> ${firstMention}`,
    many: `Multiple. Run \`/${feature} viewcurrent\``,
  };

  return isEmpty(entries) ? templates.empty : entries.length === 1 ? templates.one : templates.many;
}

function getRoleList(type: 'admins' | 'blacklisters', settings: GuildSettings): string {
  return (
    settings[type].map((id) => `<@&${id}>`).join('') || `None yet. run ${config.prefix}${type}`
  );
}
