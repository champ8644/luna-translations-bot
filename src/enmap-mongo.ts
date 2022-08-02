import * as dotenv from 'dotenv';
import EnmapMongo from 'enmap-mongo';

Error.stackTraceLimit = Infinity;
dotenv.config({ path: __dirname + '/../.env' });
const MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://localhost/luna';

export const createProvider = (arg: { name: string }) =>
  new EnmapMongo({
    ...arg,
    url: MONGODB_URL,
  });

export const provider = new EnmapMongo({
  name: 'test',
  dbName: 'enmap',
  url: MONGODB_URL,
});
