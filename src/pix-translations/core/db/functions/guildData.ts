import { DocumentType } from '@typegoose/typegoose';
import { Guild, Snowflake } from 'discord.js';
import { Map as ImmutableMap } from 'immutable';
import { UpdateQuery } from 'mongoose';
import { head, zip } from 'ramda';

import { isGuild, snowflakeToUnix } from '../../../helpers/discord';
import { deleteKey, filter, setKey } from '../../../helpers/immutableES6MapFunctions';
import { VideoId, YouTubeChannelId } from '../../../modules/holodex/frames';
import { client } from '../../lunaBotClient';
import { BlacklistNotice, GuildData, GuildDataDb } from '../models/GuildData';
import { RelayedComment } from '../models/RelayedComment';

// export const guildDataEnmap = new Enmap({
//   provider: new EnmapMongo({
//     name: 'guildData',
//     dbName: 'pix-translation',
//     url: process.env.MONGODB_URL,
//   }),
// });

// function ensure(emap: Enmap, key: string, def: any) {
//   if (emap.has(key)) return emap.get(key);
//   return def;
// }

export type ImmutableRelayHistory = ImmutableMap<VideoId, RelayedComment[]>;

export async function getAllRelayHistories(): Promise<
  ImmutableMap<Snowflake, ImmutableRelayHistory>
> {
  const datas = await Promise.all(client.guilds.cache.map(getGuildData));
  const snowflakes = datas.map((g) => g._id);
  const histories = datas.map((g) => ImmutableMap(g.relayHistory));
  return ImmutableMap(zip(snowflakes, histories));
}

export async function getGuildRelayHistory(
  g: Guild | Snowflake,
  videoId: VideoId,
): Promise<RelayedComment[]>;
export async function getGuildRelayHistory(g: Guild | Snowflake): Promise<ImmutableRelayHistory>;
export async function getGuildRelayHistory(
  g: Guild | Snowflake,
  videoId?: VideoId,
): Promise<RelayedComment[] | ImmutableRelayHistory> {
  const data = await getGuildData(g);
  return videoId ? data.relayHistory.get(videoId) ?? [] : ImmutableMap(data.relayHistory);
}

export async function getRelayNotices(
  g: Guild | Snowflake,
): Promise<ImmutableMap<VideoId, Snowflake>> {
  const data = await getGuildData(g);
  return ImmutableMap(data.relayNotices);
}

export async function addRelayNotice(
  g: Guild | Snowflake,
  videoId: VideoId,
  msgId: Snowflake,
): Promise<void> {
  const data = await getGuildData(g);
  const newNotices = setKey(videoId, msgId)(data.relayNotices);
  updateGuildData(g, { relayNotices: newNotices });
}

export async function findVidIdAndCulpritByMsgId(
  g: Guild | Snowflake | null,
  msgId: Snowflake,
): Promise<[VideoId | undefined, RelayedComment | undefined]> {
  const histories = g ? await getGuildRelayHistory(g) : undefined;
  const predicate = (cs: RelayedComment[]) => cs.some((c) => c.msgId === msgId);
  const vidId = histories?.findKey(predicate);
  const history = histories?.find(predicate);
  const culprit = history?.find((c) => c.msgId === msgId);
  return [vidId, culprit];
}

export async function getFlatGuildRelayHistory(g: Guild | Snowflake): Promise<RelayedComment[]> {
  const histories = await getGuildRelayHistory(g);
  return histories.toList().toArray().flat();
}

export async function addToGuildRelayHistory(
  videoId: VideoId,
  cmt: RelayedComment,
  g: Guild | Snowflake,
): Promise<void> {
  const data = await getGuildData(g);
  const history = data.relayHistory;
  const cmts = history.get(videoId) ?? [];
  const newHistory = setKey(videoId, [...cmts, cmt])(history);
  updateGuildData(g, { relayHistory: newHistory });
}

export async function deleteRelayHistory(videoId: VideoId, g: Guild | Snowflake): Promise<void> {
  const data = await getGuildData(g);
  const history = data.relayHistory;
  updateGuildData(g, { relayHistory: deleteKey(videoId)(history) });
}

export async function addBlacklistNotice({
  g,
  msgId,
  ytId,
  videoId,
  originalMsgId,
}: NewBlacklistNoticeProps): Promise<void> {
  const data = await getGuildData(g);
  const notices = data.blacklistNotices;
  const newNotice = { ytId, videoId, originalMsgId };
  updateGuildData(g, { blacklistNotices: setKey(msgId, newNotice)(notices) });
}

export async function getNoticeFromMsgId(
  g: Guild | Snowflake,
  msgId: Snowflake,
): Promise<BlacklistNotice | undefined> {
  const data = await getGuildData(g);
  return data.blacklistNotices.get(msgId);
}

export async function excludeLine(
  g: Guild | Snowflake,
  videoId: VideoId,
  msgId: Snowflake,
): Promise<void> {
  const data = await getGuildData(g);
  const history = data.relayHistory;
  const vidLog = history.get(videoId) ?? [];
  const culprit = vidLog.findIndex((cmt) => cmt.msgId === msgId);
  const vidHistory = [...vidLog.slice(0, culprit), ...vidLog.slice(culprit)];
  const relayHistory = setKey(videoId, vidHistory)(history);
  if (vidLog.length > 0) updateGuildData(g, { relayHistory });
}

export type NewData = UpdateQuery<DocumentType<GuildData>>;

export async function clearOldData(): Promise<void> {
  const now = new Date().getTime();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const isRecentHist = (v: RelayedComment[]) =>
    !!head(v)?.msgId && snowflakeToUnix(head(v)!.msgId!) - now < WEEK;
  const isRecentK = (_: BlacklistNotice, k: Snowflake) => snowflakeToUnix(k) - now < WEEK;
  const isRecentV = (v: Snowflake) => snowflakeToUnix(v) - now < WEEK;

  await Promise.all(
    client.guilds.cache.map(async (g) => {
      const guildData = await getGuildData(g);
      const newRelayNotices = filter(guildData.relayNotices, isRecentV);
      const newBlacklistNotices = filter(guildData.blacklistNotices, isRecentK);
      const newRelayHistory = filter(guildData.relayHistory, isRecentHist);

      updateGuildData(guildData._id, { relayNotices: newRelayNotices });
      updateGuildData(guildData._id, { relayHistory: newRelayHistory });
      updateGuildData(guildData._id, { blacklistNotices: newBlacklistNotices });
    }),
  );
}

///////////////////////////////////////////////////////////////////////////////

export async function getGuildData(g: Guild | Snowflake): Promise<GuildData> {
  const _id = isGuild(g) ? g.id : g;
  const defaults: GuildData = {
    _id,
    relayNotices: new Map(),
    relayHistory: new Map(),
    blacklistNotices: new Map(),
  };
  const query = [{ _id }, {}, { upsert: true, new: true }] as const;
  return GuildDataDb.findOneAndUpdate(...query) || defaults;
}

export async function updateGuildData(g: Guild | Snowflake, update: NewData): Promise<void> {
  const _id = (isGuild(g) ? g.id : g) ?? '0';
  const current = getGuildData(g);
  const newData = { ...current, ...update };

  const query = [{ _id }, newData, { upsert: true, new: true }] as const;
  const doc = await GuildDataDb.findOneAndUpdate(...query);
}

export async function deleteGuildData(g: Snowflake): Promise<void> {
  const _id = (isGuild(g) ? g.id : g) ?? '0';
  const doc = await GuildDataDb.deleteOne({ _id });
  // if (guildDataEnmap.has(g)) guildDataEnmap.delete(g);
}

interface NewBlacklistNoticeProps {
  g: Guild | Snowflake;
  msgId: Snowflake | undefined;
  ytId: YouTubeChannelId;
  videoId: VideoId;
  originalMsgId: Snowflake;
}
