import { writeFileSync } from 'fs';

import Isekai2 from './result2/Isekai.json';
import Legends2 from './result2/Legends.json';
import Pixela2 from './result2/Pixela.json';
import Isekai3 from './result3/Isekai.json';
import Legends3 from './result3/Legends.json';
import Pixela3 from './result3/Pixela.json';

export function main() {
  let data = Isekai3.map((each) => {
    const get = Isekai2.find((each2) => each2.chName === each.chName);
    return { ...each, name: get?.name, twitter: get?.twitter };
  });
  writeFileSync(
    'helper/result/isekai.ts',
    `export const isekai = ${JSON.stringify(data, null, 2)} as const`,
  );

  data = Legends3.map((each) => {
    const get = Legends2.find((each2) => each2.chName === each.chName);
    return { ...each, name: get?.name, twitter: get?.twitter };
  });
  writeFileSync(
    'helper/result/legends.ts',
    `export const legends = ${JSON.stringify(data, null, 2)} as const`,
  );

  data = Pixela3.map((each) => {
    const get = Pixela2.find((each2) => each2.chName === each.chName);
    return { ...each, name: get?.name, twitter: get?.twitter };
  });
  writeFileSync(
    'helper/result/pixela.ts',
    `export const pixela = ${JSON.stringify(data, null, 2)} as const`,
  );
}
main();
