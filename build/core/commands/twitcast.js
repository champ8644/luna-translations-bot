"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twitcast = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const slash_1 = require("../../helpers/discord/slash");
exports.twitcast = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Notifs',
        description: 'Starts or stops sending twitcasting livestream notifs in the current channel.',
    },
    slash: (0, slash_1.notificationCommand)({ name: 'twitcast', subject: 'twitcasting streams' }),
    callback: async (intr) => {
        const streamer = intr.options.getString('channel');
        (0, functions_1.validateInputAndModifyEntryList)({
            intr,
            verb: intr.options.getSubcommand(true),
            streamer,
            role: intr.options.getRole('role')?.id,
            feature: 'twitcasting',
            add: {
                success: `${discord_1.emoji.tc} Notifying twitcasting lives for`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s twitcasting lives are already being
          relayed in this channel.
        `,
            },
            remove: {
                success: `${discord_1.emoji.tc} Stopped notifying twitcasting lives by`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s twitcasting lives weren't already being
          notified in <#${intr.channel.id}>. Are you in the right channel?
        `,
            },
        });
    },
};
//# sourceMappingURL=twitcast.js.map