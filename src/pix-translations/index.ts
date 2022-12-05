/**
 * LUNA'S TRANSLATIONS DISCORD BOT
 */
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

import { config } from './config';
import { client } from './core';

Error.stackTraceLimit = Infinity;
dotenv.config({ path: __dirname + '/../.env' });
const MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://localhost/luna';

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

// client.on('ready', () => {
//   console.log('ready');
//   client.channels.fetch('999694564988297226').then((channel) => {
//     if (channel?.isText()) {
//       channel.send(emoji.pixela);
//     }
//   });
// });
