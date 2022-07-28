"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewblacklist = void 0;
const discord_1 = require("../../helpers/discord");
const functions_1 = require("../db/functions");
const builders_1 = require("@discordjs/builders");
const description = 'Shows blacklist';
exports.viewblacklist = {
    config: {
        permLevel: 1,
    },
    help: {
        category: 'Relay',
        description,
    },
    slash: new builders_1.SlashCommandBuilder().setName('viewblacklist').setDescription(description),
    callback: async (intr) => {
        showBlacklist(intr);
    },
};
//////////////////////////////////////////////////////////////////////////////
function showBlacklist(intr) {
    const g = (0, functions_1.getSettings)(intr);
    const header = 'Channel ID               | Name (Reason)\n';
    const entries = g.blacklist.map((e) => `${e.ytId} | ${e.name} (${e.reason})`).join('\n');
    const list = header + entries;
    (0, discord_1.reply)(intr, undefined, '', (0, discord_1.createTxtEmbed)('blacklist.txt', list));
}
//# sourceMappingURL=viewblacklist.js.map