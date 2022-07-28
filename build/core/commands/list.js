"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const builders_1 = require("@discordjs/builders");
const discord_1 = require("../../helpers/discord");
const streamers_1 = require("../db/streamers/");
const description = 'Lists supported YT channels';
exports.list = {
    config: {
        permLevel: 0,
    },
    help: {
        category: 'General',
        description: 'Lists supported YT channels.',
    },
    slash: new builders_1.SlashCommandBuilder().setName('list').setDescription(description),
    callback: (intr) => {
        (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
            title: 'Supported channels',
            description: (0, streamers_1.getStreamerList)(),
        }));
    },
};
//# sourceMappingURL=list.js.map