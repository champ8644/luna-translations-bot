"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gossip = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const slash_1 = require("../../helpers/discord/slash");
exports.gossip = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Notifs',
        description: (0, common_tags_1.oneLine) `
      Start or stop relaying a streamer's mentions in other
      streamers' livechat (includes translations and streamer comments).
    `,
    },
    slash: (0, slash_1.notificationCommand)({ name: 'gossip', subject: 'gossip' }),
    callback: (intr) => {
        const streamer = intr.options.getString('channel');
        (0, functions_1.validateInputAndModifyEntryList)({
            intr,
            verb: intr.options.getSubcommand(true),
            streamer,
            role: intr.options.getRole('role')?.id,
            feature: 'gossip',
            add: {
                success: `${discord_1.emoji.peek} Relaying gossip in other chats`,
                failure: (0, common_tags_1.oneLine) `
          :warning: Gossip about ${streamer} in other chats already being
          relayed in this channel.
        `,
            },
            remove: {
                success: `${discord_1.emoji.holo} Stopped relaying gossip`,
                failure: (0, common_tags_1.oneLine) `
          :warning: Gossip about ${streamer} wasn't already being relayed
          in <#${intr.channel.id}>. Are you in the right channel?
        `,
            },
        });
    },
};
//# sourceMappingURL=gossip.js.map