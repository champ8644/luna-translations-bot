import { writeFileSync } from 'fs';

import youtube from './youtube';

export function main() {
  youtube.search('gibpuri', 2, { part: 'snippet', type: 'channel' }, function (error, result) {
    if (error) {
      console.log(error);
    } else {
      const data = result.items.map((each) => ({
        name: each.snippet.channelTitle,
        ytId: each.id.channelId,
        chName: each.snippet.channelTitle,
        picture: each.snippet.thumbnails.high.url,
        groups: ['stella'],
        twitter: '',
        aliases: [],
      }));
      writeFileSync('helper/result_youtube.json', JSON.stringify(data, null, 2));
    }
  });
}

main();
