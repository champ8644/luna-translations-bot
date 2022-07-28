"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relay = void 0;
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const slash_1 = require("../../helpers/discord/slash");
exports.relay = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Relay',
        description: (0, common_tags_1.oneLine) `
      Start or stop relaying a streamer's translations (and owner/other
      streamer messages), in the current Discord channel.
    `,
    },
    slash: (0, slash_1.notificationCommand)({ name: 'relay', subject: 'start of TL relays' }),
    callback: (intr) => {
        const streamer = intr.options.getString('channel');
        (0, functions_1.validateInputAndModifyEntryList)({
            intr,
            verb: intr.options.getSubcommand(true),
            streamer,
            role: intr.options.getRole('role')?.id,
            feature: 'relay',
            add: {
                success: `:speech_balloon: Relaying TLs for`,
                failure: `
           :warning: ${streamer} is already being relayed in this channel
        `,
            },
            remove: {
                success: `:speech_balloon: Stopped relaying TLs for`,
                failure: (0, common_tags_1.oneLine) `
          :warning: ${streamer}'s translations weren't already being relayed
          in <#${intr.channel.id}>. Are you in the right channel?
        `,
            },
        });
    },
};
//# sourceMappingURL=relay.js.map