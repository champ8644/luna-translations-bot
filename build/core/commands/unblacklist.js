"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblacklist = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const ramda_1 = require("ramda");
const builders_1 = require("@discordjs/builders");
const description = 'Unblacklists the specified channel ID.  If none specified, unblacklists last item.';
exports.unblacklist = {
    config: {
        permLevel: 1,
    },
    help: {
        category: 'Relay',
        description,
    },
    slash: new builders_1.SlashCommandBuilder()
        .setName('unblacklist')
        .setDescription(description)
        .addStringOption((option) => option.setName('ytchannelid').setDescription('YT Channel ID')),
    callback: (intr) => {
        const ytChannel = intr.options.getString('ytchannelid');
        const processMsg = (0, ramda_1.isNil)(ytChannel) ? unblacklistLastItem : unblacklistItem;
        processMsg(intr, ytChannel);
    },
};
///////////////////////////////////////////////////////////////////////////////
function unblacklistLastItem(intr) {
    const { blacklist } = (0, functions_1.getSettings)(intr);
    const lastBlacklisted = (0, ramda_1.last)(blacklist);
    const replyContent = lastBlacklisted
        ? (0, common_tags_1.oneLine) `
      :white_check_mark: Successfully unblacklisted channel
      ${lastBlacklisted.ytId} (${lastBlacklisted.name}).
    `
        : ':warning: No items in blacklist.';
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(replyContent));
    if (lastBlacklisted)
        (0, functions_1.updateSettings)(intr, { blacklist: (0, ramda_1.init)(blacklist) });
}
function unblacklistItem(intr, ytId) {
    const success = (0, functions_1.removeBlacklisted)(intr.guild, ytId);
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(success
        ? `:white_check_mark: Successfully unblacklisted ${ytId}.`
        : `:warning: YouTube channel ID ${ytId} was not found.`));
}
//# sourceMappingURL=unblacklist.js.map