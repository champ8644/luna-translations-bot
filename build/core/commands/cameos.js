"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cameos = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const slash_1 = require("../../helpers/discord/slash");
exports.cameos = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Notifs',
        description: (0, common_tags_1.oneLine) `
      Start or stop relaying a streamer's appearances in other
      streamers' livechat.
    `,
    },
    slash: (0, slash_1.notificationCommand)({ name: 'cameos', subject: 'cameos' }),
    callback: (intr) => {
        const streamer = intr.options.getString('channel');
        (0, functions_1.validateInputAndModifyEntryList)({
            intr,
            verb: intr.options.getSubcommand(true),
            streamer,
            role: intr.options.getRole('role')?.id,
            feature: 'cameos',
            add: {
                success: `${discord_1.emoji.holo} Relaying cameos in other chats`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s cameos in other chats already being
          relayed in this channel.
        `,
            },
            remove: {
                success: `${discord_1.emoji.holo} Stopped relaying chat cameos`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s cameos' weren't already being relayed
          in <#${intr.channel.id}>. Are you in the right channel?
        `,
            },
        });
    },
};
//# sourceMappingURL=cameos.js.map