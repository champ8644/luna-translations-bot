import { isMainThread } from 'worker_threads';

import { client } from '../';
import { config } from '../../config';
import { log } from '../../helpers';
import { clearOldBotData, clearOldData } from '../db/functions';

export async function ready() {
  log(`${client.user!.tag} serving ${client.guilds.cache.size} servers.`);
  client.user!.setActivity(`${config.prefix}help`, {
    type: 'LISTENING',
    url: 'https://www.youtube.com/playlist?list=PL64PNv1gAd6qxNGSgqs2C8MyBIngQx64w',
    name: "Charisu's playlist",
  });
  if (isMainThread) {
    import('../../modules/community/communityNotifier');
    import('../../modules/youtubeNotifier');
    import('../../modules/twitcastingNotifier');
    import('../../modules/livechat/chatRelayer');

    setInterval(clearOldData, 24 * 60 * 60 * 100);
    clearOldData();
    clearOldBotData();
  }
}
