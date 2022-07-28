import { CommandInteraction, GuildMember } from 'discord.js';
import dotenv from 'dotenv';

import { isAdmin, isBlacklister } from './core/db/functions';
import { hasKickPerms, isBotOwner, isGuildOwner } from './helpers/discord';

dotenv.config({ path: __dirname + '/../.env' });

export const config: LunaBotConfig = {
  deeplKey: process.env.DEEPL_KEY,
  ownerId: '150696503428644864',
  permLevels: [
    { level: 0, name: 'User', check: () => true },
    { level: 1, name: 'Blacklister', check: isBlacklister },
    { level: 2, name: 'Admin', check: isAdmin },
    { level: 3, name: 'Guild Mod', check: hasKickPerms },
    { level: 4, name: 'Guild Owner', check: isGuildOwner },
    { level: 10, name: 'Bot Owner', check: isBotOwner },
  ],
  prefix: '/',
  token: process.env.DISCORD_DEV_TOKEN,
  twitcastingId: process.env.TWITCASTING_CLIENT_ID,
  twitcastingSecret: process.env.TWITCASTING_CLIENT_SECRET,
  holodexKey: process.env.HOLODEX_API_KEY,
};

export interface PermLevel {
  level: number;
  name: string;
  check: (x: CommandInteraction | GuildMember) => boolean | Promise<boolean>;
}

////////////////////////////////////////////////////////////////////////////////

interface LunaBotConfig {
  deeplKey?: string;
  ownerId: string;
  permLevels: PermLevel[];
  prefix: string;
  token?: string;
  twitcastingId?: string;
  twitcastingSecret?: string;
  holodexKey?: string;
}
