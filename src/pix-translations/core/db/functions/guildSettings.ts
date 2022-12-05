import { DocumentType } from '@typegoose/typegoose';
import { CommandInteraction, Guild, GuildMember, Snowflake } from 'discord.js';
import { UpdateQuery } from 'mongoose';

import { config, PermLevel } from '../../../config';
import { asyncFind } from '../../../helpers';
import { getGuildId, hasRole, isGuild } from '../../../helpers/discord';
import { YouTubeChannelId } from '../../../modules/holodex/frames';
import { client } from '../../lunaBotClient';
import { BlacklistItem, GuildSettings, GuildSettingsDb } from '../models';
import { RelayedComment } from '../models/RelayedComment';

/** @file Functions accessing or interfacing with Guild settings */
// function ensure(emap: Enmap, key: string, def: any) {
//   if (emap.has(key)) return emap.get(key);
//   return def;
// }

// export const guildSettingsEnmap = new Enmap({
//   provider: new EnmapMongo({
//     name: 'guildSettings',
//     dbName: 'pix-translation',
//     url: process.env.MONGODB_URL,
//   }),
// });
/**
 * Returns guild settings from the DB or creates them if they don't exist.
 * Returns default settings for DMs. (guildId 0)
 */
export function getSettings(
  x: CommandInteraction | Guild | GuildMember | Snowflake,
): Promise<GuildSettings> {
  const id = typeof x === 'string' ? x : getGuildId(x);
  return getGuildSettings(id ?? '0');
}

export function getAllSettings(): Promise<GuildSettings[]> {
  return Promise.all(client.guilds.cache.map(getGuildSettings));
}

export async function addBlacklisted(g: Guild | Snowflake, item: BlacklistItem): Promise<void> {
  const { blacklist } = await getSettings(g);
  updateGuildSettings(g, { blacklist: [...blacklist, item] });
}

export async function removeBlacklisted(
  g: Guild | Snowflake,
  ytId?: YouTubeChannelId,
): Promise<boolean> {
  const { blacklist } = await getSettings(g);
  const isValid = blacklist.some((entry) => entry.ytId === ytId);
  const newBlacklist = blacklist.filter((entry) => entry.ytId !== ytId);

  if (isValid) updateGuildSettings(g, { blacklist: newBlacklist });
  return isValid;
}

export async function isBlacklisted(
  ytId: YouTubeChannelId | undefined,
  g: Snowflake,
): Promise<boolean> {
  const { blacklist } = await getSettings(g);
  return blacklist.some((entry) => entry.ytId === ytId);
}

export function isAdmin(x: CommandInteraction | GuildMember): boolean {
  return hasPerms(x, 'admins');
}

export function isBlacklister(x: CommandInteraction | GuildMember): boolean {
  return hasPerms(x, 'blacklisters');
}

export async function getPermLevel(x: GuildMember): Promise<PermLevel> {
  const perms = getPermLevels();
  const userPerm = await asyncFind(perms, (level) => level.check(x));
  return userPerm!;
}

export async function filterAndStringifyHistory(
  guild: CommandInteraction | Guild | GuildMember | Snowflake,
  history: RelayedComment[],
  start?: string,
): Promise<string> {
  const g = await getSettings(guild);
  const blacklist = g.blacklist.map((entry) => entry.ytId);
  const unwanted = g.customBannedPatterns;
  return history
    .filter((cmt) => isNotBanned(cmt, unwanted, blacklist))
    .map((cmt) => {
      const startTime = new Date(Date.parse(start ?? '')).valueOf();
      const loggedTime = new Date(+cmt.absoluteTime).valueOf();
      const timestamp = start
        ? new Date(loggedTime - startTime).toISOString().substr(11, 8)
        : '[?]';
      return `${timestamp} (${cmt.author}) ${cmt.body}`;
    })
    .join('\n');
}

export type PrivilegedRole = 'admins' | 'blacklisters';

export type NewSettings = UpdateQuery<DocumentType<GuildSettings>>;

//// PRIVATE //////////////////////////////////////////////////////////////////

export async function deleteGuildSettings(g: Snowflake): Promise<void> {
  const _id = isGuild(g) ? g.id : g;
  const doc = GuildSettingsDb.deleteOne({ _id });

  // const defaults: GuildSettings = {
  //   _id,
  //   admins: [],
  //   blacklist: [],
  //   blacklisters: [],
  //   cameos: [],
  //   community: [],
  //   customWantedPatterns: [],
  //   customBannedPatterns: [],
  //   deepl: true,
  //   logChannel: undefined,
  //   gossip: [],
  //   modMessages: true,
  //   relay: [],
  //   threads: false,
  //   twitcasting: [],
  //   youtube: [],
  // };
  // const query = [{ _id }, defaults, { upsert: true, new: true }] as const;
  // const doc = await GuildSettingsDb.findOneAndUpdate(...query);

  // const query = [{ _id }, {}, { upsert: true, new: true }] as const;
  // GuildSettingsDb.deleteOne({ _id })
  // return GuildSettingsDb.findOneAndUpdate(...query) || defaults;
  // if (guildSettingsEnmap.has(g)) guildSettingsEnmap.delete(g);
}

async function getGuildSettings(g: Guild | Snowflake): Promise<GuildSettings> {
  const _id = isGuild(g) ? g.id : g;
  const defaults: GuildSettings = {
    _id,
    admins: [],
    blacklist: [],
    blacklisters: [],
    cameos: [],
    community: [],
    customWantedPatterns: [],
    customBannedPatterns: [],
    deepl: true,
    logChannel: undefined,
    gossip: [],
    modMessages: true,
    relay: [],
    threads: false,
    twitcasting: [],
    youtube: [],
  };
  const query = [{ _id }, {}, { upsert: true, new: true }] as const;
  return GuildSettingsDb.findOneAndUpdate(...query) || defaults;
}

// async function updateGuildSettings(update: GuildSettings): Promise<void> {
//   const _id = isGuild(g) ? g.id : g;
//   const query = [{ _id }, update, { upsert: true, new: true }] as const;
//   const doc = await GuildSettingsDb.findOneAndUpdate(...query);
// }

export async function updateGuildSettings(
  x: CommandInteraction | Guild | GuildMember | Snowflake,
  update: NewSettings,
): Promise<void> {
  const isObject =
    x instanceof CommandInteraction || x instanceof Guild || x instanceof GuildMember;
  const _id = isObject ? getGuildId(x as any) ?? '0' : (x as any);
  const current = getSettings(_id);
  const newData = { ...current, ...update };

  // guildSettingsEnmap.set(_id, newData);

  const query = [{ _id }, newData, { upsert: true, new: true }] as const;
  const doc = await GuildSettingsDb.findOneAndUpdate(...query);
}

// function getGuildSettings(g: Guild | Snowflake): GuildSettings {
//   const _id = isGuild(g) ? g.id : g;
//   const defaults: GuildSettings = {
//     _id,
//     admins: [],
//     blacklist: [],
//     blacklisters: [],
//     cameos: [],
//     community: [],
//     customWantedPatterns: [],
//     customBannedPatterns: [],
//     deepl: true,
//     logChannel: undefined,
//     gossip: [],
//     modMessages: true,
//     relay: [],
//     threads: false,
//     twitcasting: [],
//     youtube: [],
//   };
//   return ensure(guildSettingsEnmap, _id, defaults);
// }

/** Returns perm levels in descending order (Bot Owner -> User) */
function getPermLevels(): PermLevel[] {
  return [...config.permLevels].sort((a, b) => b.level - a.level);
}

function hasPerms(x: CommandInteraction | GuildMember, roleType: PrivilegedRole): boolean {
  const settings = getSettings(x);
  const roles = settings[roleType];

  return <boolean>roles!.some((role) => hasRole(x, role));
}

function isNotBanned(
  cmt: RelayedComment,
  unwanted: string[],
  blacklist: YouTubeChannelId[],
): boolean {
  return (
    blacklist.every((ytId) => ytId !== cmt.ytId) &&
    unwanted.every((p) => !cmt.body.toLowerCase().includes(p.toLowerCase()))
  );
}
