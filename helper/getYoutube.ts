import { writeFileSync } from 'fs';

import youtube from './youtube';

export function getYoutube(query: string, output: string = 'result') {
  youtube.search(query, 2, { part: 'snippet', type: 'channel' }, function (error, result) {
    if (error) {
      console.log(error);
    } else {
      const data = result.items.map((each) => ({
        name: each.snippet.channelTitle,
        ytId: each.id.channelId,
        chName: each.snippet.channelTitle,
        picture: each.snippet.thumbnails.high.url,
        groups: [''],
        twitter: '',
        aliases: [],
      }));
      writeFileSync(`helper/${output}.json`, JSON.stringify(data, null, 2));
    }
  });
}
