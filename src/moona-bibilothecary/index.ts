import { Message } from 'discord.js';
import express, { Request, Response } from 'express';

import client from './client';
import CommandHandler from './commandHandler';
import config from './config/botConfig';
import moonaEmoji from './config/moonaEmoji';
import { DISCORD_TOKEN, version } from './config/secrets';
import imgur from './imgur';

const PORT = process.env.PORT || 5000;

const app = express();

//////////////////////////////////////////////////////////////////
//             EXPRESS SERVER SETUP FOR UPTIME ROBOT            //
//////////////////////////////////////////////////////////////////
app.use(express.urlencoded({ extended: true }));

app.use('/', (request: Request, response: Response) => {
  response.sendStatus(200);
});

const commandHandler = new CommandHandler(config.prefix);

//////////////////////////////////////////////////////////////////
//                    DISCORD CLIENT LISTENERS                  //
//////////////////////////////////////////////////////////////////
// Discord Events: https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-channelCreate

client.on('ready', () => {
  console.log('Moona-Bibliothecary has started ', version);
  moonaEmoji.constructorAsync();
  imgur.init();
});
client.on('messageCreate', (message: Message) => {
  commandHandler.handleMessage(message);
});
client.on('error', (e) => {
  console.error('Discord client error!', e);
});

client.login(DISCORD_TOKEN);
app.listen(PORT, () => console.log(`Server started on port ${PORT}!`));
