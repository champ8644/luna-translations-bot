/**
 * @file This file manages addition and removals from WatchFeatureSettings
 * via Discord command.
 **/
import { CommandInteraction, EmbedFieldData, Snowflake } from 'discord.js';
import { splitEvery } from 'ramda';

import { createEmbed, createEmbedMessage, emoji, reply } from '../../../helpers/discord';
import { match } from '../../../helpers/language';
import { GuildSettings, WatchFeature, WatchFeatureSettings } from '../../db/models';
import { findStreamerName, replyStreamerList, StreamerName, streamers } from '../../db/streamers/';
import { getSettings, updateGuildSettings } from './';
import { getAllSettings } from './guildSettings';

const { isArray } = Array;

export async function validateInputAndModifyEntryList({
  intr,
  verb,
  streamer,
  role,
  feature,
  add,
  remove,
}: WatchFeatureModifyOptions): Promise<void> {
  const validatedStreamer = <StreamerName | undefined>findStreamerName(streamer);
  const mustShowList = verb !== 'clear' && !validatedStreamer;
  const g = await getSettings(intr.guild!);
  const modifyIfValid =
    verb === 'viewcurrent' ? replyCurrent : mustShowList ? replyStreamerList : modifyEntryList;

  modifyIfValid({ g, intr, feature, role, add, remove, verb, streamer: validatedStreamer! });
}

export async function getSubbedGuilds(
  nameOrChannelId: string,
  features: WatchFeature | WatchFeature[],
): Promise<GuildSettings[]> {
  const guilds = await getAllSettings();
  const streamer =
    streamers.find((s) => s.ytId === nameOrChannelId)?.name ??
    (streamers.find((s) => s.name === nameOrChannelId)?.name as any);
  const feats = isArray(features) ? features : [features];

  return guilds.filter((g) => getSubs(g, feats).some((sub) => [streamer, 'all'].includes(sub)));
}

///////////////////////////////////////////////////////////////////////////////

async function modifyEntryList(opts: ValidatedOptions): Promise<void> {
  const g = await getSettings(opts.intr);
  const isNew = g[opts.feature].every(
    (r) => r.discordCh != opts.intr.channel?.id || r.streamer != opts.streamer,
  );
  const applyModification = match(opts.verb, {
    add: isNew ? addEntry : notifyNotNew,
    remove: !isNew ? removeEntry : notifyNotFound,
    clear: clearEntries,
  });

  applyModification(opts);
}

async function addEntry({
  g,
  feature,
  intr,
  streamer,
  role,
  add,
}: ValidatedOptions): Promise<void> {
  const newEntries = [
    ...g[feature],
    {
      streamer,
      discordCh: intr.channel!.id,
      ...(role ? { roleToNotify: role } : {}),
    },
  ];

  await updateGuildSettings(intr, { [feature]: newEntries });
  reply(
    intr,
    createEmbed(
      {
        fields: [
          {
            name: add.success,
            value: streamer,
            inline: true,
          },
          {
            name: `${emoji.discord} In channel`,
            value: `<#${intr.channel?.id}>`,
            inline: true,
          },
          ...(role
            ? [
                {
                  name: `${emoji.ping} @mentioning`,
                  value: `<@&${role}>`,
                  inline: true,
                },
              ]
            : []),
          ...getEntryFields(newEntries),
        ],
      },
      false,
    ),
  );
}

function replyCurrent({ g, feature, intr, streamer, role, add }: ValidatedOptions): void {
  const newEntries = [...g[feature]];

  reply(
    intr,
    createEmbed(
      {
        description: 'Current',
        fields: [...getEntryFields(newEntries)],
      },
      false,
    ),
  );
}

async function removeEntry({
  feature,
  intr,
  streamer,
  remove,
  g,
}: ValidatedOptions): Promise<void> {
  const newEntries = g[feature].filter(
    (r) => r.discordCh !== intr.channel!.id || r.streamer !== streamer,
  );

  await updateGuildSettings(intr, { [feature]: newEntries });
  reply(
    intr,
    createEmbed(
      {
        fields: [
          {
            name: remove.success,
            value: streamer,
            inline: true,
          },
          {
            name: `${emoji.discord} In channel`,
            value: `<#${intr.channel!.id}>`,
            inline: true,
          },
          ...getEntryFields(newEntries),
        ],
      },
      false,
    ),
  );
}

function notifyNotNew({ intr, add, g, feature }: ValidatedOptions): void {
  reply(
    intr,
    createEmbed(
      {
        description: add.failure,
        fields: getEntryFields(g[feature]),
      },
      false,
    ),
  );
}

function notifyNotFound({ intr, remove, g, feature }: ValidatedOptions): void {
  reply(
    intr,
    createEmbed(
      {
        fields: [
          {
            name: 'Error',
            value: remove.failure,
            inline: false,
          },
          ...getEntryFields(g[feature]),
        ],
      },
      false,
    ),
  );
}

async function clearEntries({ feature, intr }: ValidatedOptions): Promise<void> {
  await updateGuildSettings(intr, { [feature]: [] });
  reply(intr, createEmbedMessage(`Cleared all entries for ${feature}.`));
}

function getEntryFields(entries: WatchFeatureSettings[]): EmbedFieldData[] {
  return getEntryList(entries, 10).map((list) => ({
    name: 'Currently relayed',
    value: list || 'No one',
    inline: false,
  }));
}

/** Returns an array of embed-sized strings */
function getEntryList(entries: WatchFeatureSettings[], linesPerChunk: number = 20): string[] {
  const lines = entries.map((x) =>
    x.roleToNotify
      ? `${x.streamer} in <#${x.discordCh}> @mentioning <@&${x.roleToNotify}>`
      : `${x.streamer} in <#${x.discordCh}>`,
  );
  const chunks = splitEvery(linesPerChunk)(lines);

  return chunks.map((chunk) => chunk.join('\n'));
}

function getSubs(g: GuildSettings, fs: WatchFeature[]): StreamerName[] {
  return fs.flatMap((f) => g[f].map((entry) => entry.streamer));
}

interface WatchFeatureModifyOptions {
  intr: CommandInteraction;
  verb: 'add' | 'remove' | 'clear' | 'viewcurrent';
  streamer: string;
  role?: Snowflake;
  feature: WatchFeature;
  add: AttemptResultMessages;
  remove: AttemptResultMessages;
}

export interface ValidatedOptions extends WatchFeatureModifyOptions {
  g: GuildSettings;
  streamer: StreamerName;
}

interface AttemptResultMessages {
  success: string;
  failure: string;
}
