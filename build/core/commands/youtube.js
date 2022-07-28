"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtube = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const slash_1 = require("../../helpers/discord/slash");
exports.youtube = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Notifs',
        description: `Starts or stops sending youtube livestream notifs in the current channel.`,
    },
    slash: (0, slash_1.notificationCommand)({ name: 'youtube', subject: 'YouTube lives' }),
    callback: async (intr) => {
        const streamer = intr.options.getString('channel');
        (0, functions_1.validateInputAndModifyEntryList)({
            intr,
            verb: intr.options.getSubcommand(true),
            streamer,
            role: intr.options.getRole('role')?.id,
            feature: 'youtube',
            add: {
                success: `${discord_1.emoji.yt} Notifying YouTube lives for`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s YouTube lives are already being
          relayed in this channel.
        `,
            },
            remove: {
                success: `${discord_1.emoji.yt} Stopped notifying YouTube lives by`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s YouTube lives weren't already being
          notified in <#${intr.channel.id}>. Are you in the right channel?
        `,
            },
        });
    },
};
//# sourceMappingURL=youtube.js.map