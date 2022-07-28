import * as dotenv from 'dotenv';

import { client } from '.';
import { config } from '../config';
import { loadAllCommands } from '../helpers/discord/loaders';

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
dotenv.config({ path: __dirname + '/../../.env' });

const commands = loadAllCommands();
console.log('🚀 ~ file: registerSlashCommands.ts ~ line 12 ~ commands', commands);

const clientId = '1001486026772066384';
// const clientId = '819785987420848128'
// const guildId = '797780320405553223'

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_PROD_TOKEN);

client.login(config.token);

const musicCmds = [
  { name: 'clear', description: 'Clear all tracks from queue', options: [] },
  { name: 'disconnect', description: 'Stops the music and leaves the voice channel', options: [] },
  { name: 'help', description: 'Shows music help commands', options: [] },
  { name: 'loop', description: 'Loop the current song', options: [] },
  { name: 'loopqueue', description: 'Loop the queue', options: [] },
  {
    name: 'lyrics',
    description: 'Shows lyrics of a song',
    options: [
      { type: 3, name: 'song', description: 'The song to get lyrics for', required: false },
    ],
  },
  {
    name: 'move',
    description: 'Moves track to a different position',
    options: [
      { type: 4, name: 'track', description: 'The track number to move', required: true },
      {
        type: 4,
        name: 'position',
        description: 'The position to move the track to',
        required: true,
      },
    ],
  },
  {
    name: 'nowplaying',
    description: 'Shows the current song playing in the voice channel.',
    options: [],
  },
  { name: 'pause', description: 'Pause current playing track', options: [] },
  {
    name: 'play',
    description: 'Play music in the voice channel',
    options: [
      { type: 3, name: 'query', description: 'Search string to search the music', required: true },
    ],
  },
  { name: 'queue', description: 'Shows the current queue', options: [] },
  {
    name: 'remove',
    description: "Remove track you don't want from queue",
    options: [{ type: 10, name: 'number', description: 'Enter track number.', required: true }],
  },
  { name: 'resume', description: 'Resume current playing track', options: [] },
  {
    name: 'search',
    description: 'Search for a song',
    options: [{ type: 3, name: 'query', description: 'The song to search for', required: true }],
  },
  {
    name: 'seek',
    description: 'Seek to a specific time in the current song.',
    options: [
      {
        type: 3,
        name: 'time',
        description: 'Seek to time you want. Ex 2m | 10s | 53s',
        required: true,
      },
    ],
  },
  { name: 'shuffle', description: 'Shuffle the current queue.', options: [] },
  { name: 'skip', description: 'Skip the current song', options: [] },
  { name: 'summon', description: 'Summons the bot to the channel.', options: [] },
  {
    name: 'volume',
    description: 'Change the volume of the current song.',
    options: [
      {
        type: 10,
        name: 'amount',
        description: 'Amount of volume you want to change. Ex: 10',
        required: false,
      },
    ],
  },
];

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    const body = [
      ...musicCmds,
      ...commands
        .map((v, k) => {
          console.log(`jsonning ${k}`);
          return v.slash.toJSON();
        })
        .toList()
        .toArray(),
    ];

    console.log(body);
    console.log('====================');
    await rest.put(Routes.applicationCommands(clientId), { body });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
