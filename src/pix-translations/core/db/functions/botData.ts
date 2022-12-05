import { DocumentType } from '@typegoose/typegoose';
import { UpdateQuery } from 'mongoose';

import { filter, setKey } from '../../../helpers/immutableES6MapFunctions';
import { VideoId } from '../../../modules/holodex/frames';
import { BotData, BotDataDb } from '../models';
import { RelayedComment } from '../models/RelayedComment';

const _id = '000000000022';

// export const botDataEnmap = new Enmap({
//   provider: new EnmapMongo({
//     name: 'botData',
//     dbName: 'pix-translation',
//     url: process.env.MONGODB_URL,
//   }),
// });

// function ensure(emap: Enmap, key: string, def: any) {
//   if (emap.has(key)) return emap.get(key);
//   return def;
// }

export async function addNotifiedLive(videoId: VideoId): Promise<void> {
  const botData = await getBotData();
  const currentList = botData.notifiedYtLives;
  updateBotData({ notifiedYtLives: [...currentList, videoId] as VideoId[] });
  // const currentList = ensure(botDataEnmap, 'notifiedYtLives', []) as VideoId[];
  // botDataEnmap.set('notifiedYtLives', [...currentList, videoId] as VideoId[]);
}

export async function getNotifiedLives(): Promise<VideoId[]> {
  const botData = await getBotData();
  return botData.notifiedYtLives || ([] as VideoId[]);
  // return ensure(botDataEnmap, 'notifiedYtLives', []) as VideoId[];
}

export async function addNotifiedCommunityPost(url: string): Promise<void> {
  const currentList = (await getBotData()).notifiedCommunityPosts;
  updateBotData({ notifiedCommunityPosts: [...currentList, url] });
  // const currentList = ensure(botDataEnmap, 'notifiedCommunityPosts', []);
  // botDataEnmap.set('notifiedCommunityPosts', [...currentList, url]);
}

export async function getNotifiedCommunityPosts(): Promise<string[] | undefined> {
  const botData = await getBotData();
  return botData.notifiedCommunityPosts || [];
  // return ensure(botDataEnmap, 'notifiedCommunityPosts', []) as string[];
}

export async function getRelayHistory(videoId?: VideoId): Promise<RelayedComment[] | undefined> {
  const botData = await getBotData();
  const hists = botData.relayHistory;
  return hists.get(videoId ?? '');
}

export async function addToBotRelayHistory(videoId: VideoId, cmt: RelayedComment): Promise<void> {
  const botData = await getBotData();
  const history = botData.relayHistory;
  const cmts = history.get(videoId) ?? [];
  const newHistory = setKey(videoId, [...cmts, cmt])(history);
  updateBotData({ relayHistory: newHistory });
}

export async function clearOldBotData() {
  const botData = await getBotData();
  const history = botData.relayHistory;
  console.log(`history len is ${history.size}`);
  const newHistory = filter(history, (v, k) => v[0].absoluteTime > Date.now() - 86400000);
  console.log(`new his len ${newHistory.size}`);
  updateBotData({ relayHistory: newHistory });
}

///////////////////////////////////////////////////////////////////////////////

async function getBotData(): Promise<BotData> {
  const query = [{ _id }, {}, { upsert: true, new: true }] as const;
  return BotDataDb.findOneAndUpdate(...query);
}

async function updateBotData(update: NewData): Promise<void> {
  const query = [{ _id }, update, { upsert: true, new: true }] as const;
  const doc = await BotDataDb.findOneAndUpdate(...query);
}

type NewData = UpdateQuery<DocumentType<BotData>>;
