"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const functions_1 = require("./core/db/functions");
const discord_1 = require("./helpers/discord");
dotenv_1.default.config({ path: __dirname + '/../.env' });
exports.config = {
    deeplKey: process.env.DEEPL_KEY,
    ownerId: '150696503428644864',
    permLevels: [
        { level: 0, name: 'User', check: () => true },
        { level: 1, name: 'Blacklister', check: functions_1.isBlacklister },
        { level: 2, name: 'Admin', check: functions_1.isAdmin },
        { level: 3, name: 'Guild Mod', check: discord_1.hasKickPerms },
        { level: 4, name: 'Guild Owner', check: discord_1.isGuildOwner },
        { level: 10, name: 'Bot Owner', check: discord_1.isBotOwner },
    ],
    prefix: '/',
    token: process.env.DISCORD_DEV_TOKEN,
    twitcastingId: process.env.TWITCASTING_CLIENT_ID,
    twitcastingSecret: process.env.TWITCASTING_CLIENT_SECRET,
    holodexKey: process.env.HOLODEX_API_KEY,
};
//# sourceMappingURL=config.js.map