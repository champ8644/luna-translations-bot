import { stripIndent } from 'common-tags';
import { isMainThread } from 'worker_threads';

import { addNotifiedLive, getNotifiedLives } from '../core/db/functions';
import { Streamer, streamers } from '../core/db/streamers';
import { log } from '../helpers';
import { emoji } from '../helpers/discord';
import { frameEmitter } from './holodex/frameEmitter';
import { DexFrame } from './holodex/frames';
import { notifyDiscord, NotifyOptions } from './notify';

if (isMainThread) frameEmitter.on('frame', notifyFrame);

async function notifyFrame(frame: DexFrame): Promise<void> {
  const streamer = streamers.find((s) => s.ytId === frame.channel.id);
  const notifiedLives = await getNotifiedLives();
  const isRecorded = notifiedLives.includes(frame.id);
  const isNew = streamer && !isRecorded;
  const mustNotify = isNew && frame.status === 'live';

  if (isNew) log(`${frame.status} | ${frame.id} | ${streamer!.name}`);

  if (mustNotify) {
    notifyDiscord({
      feature: 'youtube',
      streamer: streamer as Streamer,
      embedBody: `I am live on YouTube!\nhttps://youtu.be/${frame.id}`,
      emoji: emoji.yt,
      avatarUrl: frame.channel.photo,
      nonEmbedText: `https://youtu.be/${frame.id}`,
    });

    notifyDiscord(getRelayNotifyProps(frame));

    addNotifiedLive(frame.id);
  }
}

export function getRelayNotifyProps(frame: DexFrame): NotifyOptions {
  return {
    feature: 'relay',
    streamer: streamers.find((s) => s.ytId === frame.channel.id)!,
    embedBody: stripIndent`
      I will now relay translations from live translators.
      ${frame.title}
      https://youtu.be/${frame.id}
    `,
    emoji: emoji.holo,
    videoId: frame.id,
    avatarUrl: frame.channel.photo,
    credits: true,
  };
}
