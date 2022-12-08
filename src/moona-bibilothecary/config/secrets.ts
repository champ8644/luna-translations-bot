import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export const DISCORD_TOKEN = process.env['ML_token'];

export const POSTGRES_DATABASE_URL = process.env['ML_DATABASE_URL'];

export const GOOGLE_APIS_KEY = process.env['ML_GOOGLE_APIS_KEY'];

export const DEV = process.env.DEV === 'TRUE';

export const IMGUR_CLIENT_ID = process.env['ML_IMGUR_CLIENT_ID'];
export const IMGUR_CLIENT_SECRET = process.env['ML_IMGUR_CLIENT_SECRET'];
// export const IMGUR_REFRESH_TOKEN = process.env["ML_IMGUR_REFRESH_TOKEN"];
// export const IMGUR_ACCESS_TOKEN = process.env["ML_IMGUR_ACCESS_TOKEN"];

if (!DISCORD_TOKEN) {
  console.error("No 'discord token' provided in .env file.");
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { ml_version: version } = require('../../../package.json') as { ml_version: string };
