// name: 'AZKi',
// ytId: 'UC0TXe_LYZ4scaW2XMyi5_kw',
// chName: 'AZKi Channel',
// picture:
// //   'https://yt3.ggpht.com/ytc/AAUvwnh85tQLdg3chip7aFBjFZyORHi40WPjcFRWaQq8Wg=s800-c-k-c0x00ffffff-no-rj',
// groups: ['0th Generation'],
// twitter: 'AZKi_VDiVA',
// aliases: ['azki'],
import { writeFileSync } from 'fs';
import _ from 'lodash';

import summary from './pixela_summary.json';
import Isekai from './result2/Isekai.json';
import Legends from './result2/Legends.json';
import Pixela from './result2/Pixela.json';
import youtube from './youtube';

const databaseJson = [...Isekai, ...Legends, ...Pixela];

type DataCell = {
  name: string;
  ytId: string;
  chName: string;
  picture: string;
  groups: Array<string>;
  twitter: string;
  aliases: Array<string>;
};

export function main() {
  _.forEach(summary, async (arr, group) => {
    const result: Array<DataCell> = (await Promise.all(
      arr.map(({ id: ytId }) => searchYt({ ytId, group })),
    )) as Array<DataCell>;
    writeFileSync(`helper/result/${group}.json`, JSON.stringify(result, null, 2));
  });
}

function searchYt(arg: { ytId: string; group: string }) {
  const { ytId, group } = arg;
  return new Promise((resolve, reject) => {
    youtube.search(
      'Pixela',
      1,
      { part: 'snippet', channelId: ytId, type: 'channel' },
      (error, result) => {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          const data = result.items[0];
          const chName = data.snippet.channelTitle;
          const name = databaseJson.find((item) => item.chName === chName)?.name;
          const picture = data.snippet.thumbnails.high.url;
          const groups = [group];
          const twitter = databaseJson.find((item) => item.chName === chName)?.twitter;
          const aliases = [];
          resolve({
            name,
            ytId,
            chName,
            picture,
            groups,
            twitter,
            aliases,
          });
        }
      },
    );
  });
}

main();
