"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threads = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const builders_1 = require("@discordjs/builders");
exports.threads = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Relay',
        description: (0, common_tags_1.oneLine) `
      Toggles the posting of translations in threads.
      Requires Public Threads permissions.
    `,
    },
    slash: new builders_1.SlashCommandBuilder().setName('thread').setDescription('Dead feature'),
    callback: (intr) => {
        (0, discord_1.reply)(intr, undefined, 'Pretty sure this feature has been dead for a while. Instead please set relay inside a thread manually.');
        // toggleSetting ({
        // msg, setting: 'threads',
        // enable: `
        // :hash: I will now relay translations in a thread.
        // This requires "Public Threads" permissions.
        // If given "Manage Messages" permissions, I will pin each thread for 24h.
        // `,
        // disable: ':hash: I will no longer relay translations in a thread.'
        // })
    },
};
//# sourceMappingURL=threads.js.map