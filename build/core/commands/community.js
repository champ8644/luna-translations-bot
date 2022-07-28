"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.community = void 0;
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const slash_1 = require("../../helpers/discord/slash");
exports.community = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Notifs',
        description: `Starts or stops sending community post notifs in the current channel.`,
    },
    slash: (0, slash_1.notificationCommand)({ name: 'community', subject: 'community posts' }),
    callback: (intr) => {
        const streamer = intr.options.getString('channel');
        (0, functions_1.validateInputAndModifyEntryList)({
            intr,
            verb: intr.options.getSubcommand(true),
            streamer,
            role: intr.options.getRole('role')?.id,
            feature: 'community',
            add: {
                success: `:family_mmbb: Notifying community posts by`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s community posts are already being
          relayed in this channel.
        `,
            },
            remove: {
                success: `:family_mmbb: Stopped notifying community posts by`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s community posts weren't already being notified
          in <#${intr.channel.id}>. Are you in the right channel?
        `,
            },
        });
    },
};
//# sourceMappingURL=community.js.map