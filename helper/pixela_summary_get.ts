import { writeFileSync } from 'fs';

import youtube from './youtube';

export function main() {
  type ArrDataGet = Array<{
    id: string;
    title: string;
  }>;
  const output = {
    Pixela: [] as ArrDataGet,
    Isekai: [] as ArrDataGet,
    Legends: [] as ArrDataGet,
  };
  youtube.search('Pixela', 5, { part: 'snippet', type: 'channel' }, function (error, result) {
    if (error) {
      console.log(error);
    } else {
      const data = result.items.map((each) => ({
        title: each.snippet.channelTitle,
        id: each.id.channelId,
      }));
      console.log('🚀 ~ file: youtubeget.ts ~ line 32 ~ data ~ data', data);

      data.forEach((each) => {
        if (/Pixela-Isekai/.test(each.title)) {
          output.Isekai.push(each);
        } else if (/Pixela Project/.test(each.title)) {
          output.Pixela.push(each);
        } else if (/Pixela Legends/.test(each.title)) {
          output.Legends.push(each);
        }
      });

      writeFileSync('helper/result2.json', JSON.stringify(output, null, 2));
    }
  });
}

main();
