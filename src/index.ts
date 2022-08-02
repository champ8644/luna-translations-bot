/**
 * LUNA'S TRANSLATIONS DISCORD BOT
 */
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

import { config } from './config';
import { client } from './core/';

Error.stackTraceLimit = Infinity;
dotenv.config({ path: __dirname + '/../.env' });
const MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://localhost/luna';
console.log('🚀 ~ file: index.ts ~ line 13 ~ MONGODB_URL', MONGODB_URL);

mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

process.on('uncaughtException', function (err) {
  console.log('Uncaught exception: ' + err);
  console.log(err.stack);
});

client.login(config.token);
