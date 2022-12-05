import EventEmitter from 'events';

import { addNotifiedCommunityPost, getAllSettings, getNotifiedCommunityPosts } from '../../core/db/functions';
import { streamers } from '../../core/db/streamers/';
import { removeDupes, sleep } from '../../helpers';
import { asyncTryOrLog } from '../../helpers/tryCatch';
import { getLatestPost } from './getLatestPost';

export const communityEmitter = CommunityEmitter();

///////////////////////////////////////////////////////////////////////////////

function CommunityEmitter(): EventEmitter {
  const emitter = new EventEmitter();
  continuouslyEmitNewPosts(emitter);
  return emitter;
}

async function continuouslyEmitNewPosts(emitter: EventEmitter): Promise<void> {
  const allSettings = await getAllSettings();
  const subs = removeDupes(
    allSettings
      .flatMap((settings) => settings.community)
      .map(({ streamer }) => streamers?.find((s) => s.name === streamer)!.ytId),
  );

  for (const ytId of subs) {
    await sleep(2000);
    await asyncTryOrLog(() => checkChannel(ytId, emitter));
  }

  setTimeout(() => continuouslyEmitNewPosts(emitter), 2000);
}

async function checkChannel(ytId: string, emitter: EventEmitter): Promise<void> {
  const notified = await getNotifiedCommunityPosts();
  const post = await getLatestPost(ytId);
  const mustEmit = post && notified && !notified.includes(post.url) && post.isToday;

  if (mustEmit) {
    addNotifiedCommunityPost(post!.url);
    emitter.emit('post', post);
  }
}
