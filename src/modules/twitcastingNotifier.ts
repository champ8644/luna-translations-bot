import { isMainThread } from 'worker_threads';
import WebSocket from 'ws';

import { config } from '../config';
import { getAllSettings } from '../core/db/functions';
import { GuildSettings } from '../core/db/models';
import { getTwitterUsername, Streamer, streamers } from '../core/db/streamers';
import { emoji } from '../helpers/discord';
import { tryOrLog } from '../helpers/tryCatch';
import { notifyDiscord } from './notify';

const { twitcastingId, twitcastingSecret } = config;

if (isMainThread) initTwitcast();

function initTwitcast(): void {
  const socket = new WebSocket(
    `wss://${twitcastingId}:${twitcastingSecret}@realtime.twitcasting.tv/lives`,
  );
  socket.on('error', socket.close);
  socket.on('close', initTwitcast);
  socket.on('message', processMessage);
}

async function processMessage(data: any): Promise<void> {
  const json = tryOrLog(() => JSON.parse(data as string));
  const lives = json?.movies?.map(processPayloadEntry) as any[];
  const settings = await getAllSettings();
  lives?.forEach((live) => notifyLive(live, settings));
}

function processPayloadEntry(message: any): TwitcastingLive {
  return {
    name: message.broadcaster?.screen_id,
    movieId: message.movie?.id,
  };
}

async function notifyLive(live: TwitcastingLive, settings: GuildSettings[]): Promise<void> {
  return notifyDiscord({
    avatarUrl: '',
    subbedGuilds: settings.filter((g) => isRelaying(g, live.name)),
    feature: 'twitcasting',
    streamer: streamers.find((x) => x.twitter === live.name) as Streamer,
    emoji: emoji.tc,
    embedBody: `
      I am live on Twitcasting!
      https://twitcasting.tv/${live.name}/movie/${live.movieId}
    `,
  });
}

function isRelaying(guild: GuildSettings, streamer: TwitterName): boolean {
  return guild.twitcasting.some((entry) => streamer === getTwitterUsername(entry.streamer));
}

interface TwitcastingLive {
  name: string;
  movieId: string;
}

type TwitterName = string;
