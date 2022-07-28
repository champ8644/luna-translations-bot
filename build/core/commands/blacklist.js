"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklist = void 0;
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const functions_1 = require("../db/functions");
const commentBooleans_1 = require("../../modules/livechat/commentBooleans");
const builders_1 = require("@discordjs/builders");
const helpers_1 = require("../../helpers");
exports.blacklist = {
    config: {
        permLevel: 1,
    },
    help: {
        category: 'Relay',
        description: (0, common_tags_1.oneLine) `Blacklists author`,
    },
    slash: new builders_1.ContextMenuCommandBuilder().setName('blacklist').setType(3),
    callback: async (intr) => {
        if (!intr.isMessageContextMenu()) {
            (0, helpers_1.warn)('Something very weird happened.');
            return;
        }
        const reason = 'Requested by context menu interaction';
        blacklistTl(intr, reason);
    },
};
//////////////////////////////////////////////////////////////////////////////
function blacklistTl(intr, reason) {
    const settings = (0, functions_1.getSettings)(intr.guild);
    const refId = intr.targetId;
    const history = (0, functions_1.getFlatGuildRelayHistory)(intr.guild);
    const culprit = history.find((cmt) => cmt.msgId === refId);
    const duplicate = culprit && (0, commentBooleans_1.isBlacklisted)(culprit.ytId, settings);
    const callback = duplicate
        ? notifyDuplicate
        : culprit
            ? addBlacklistedAndConfirm
            : notifyTranslatorNotFound;
    callback(intr, culprit, reason);
}
function notifyDuplicate(intr) {
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(':warning: Already blacklisted'));
}
function addBlacklistedAndConfirm(intr, { ytId, author }, reason) {
    (0, functions_1.addBlacklisted)(intr.guild, { ytId: ytId, name: author, reason });
    (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
        fields: [
            {
                name: ':no_entry: Blacklister',
                value: intr.user.toString(),
                inline: true,
            },
            {
                name: ':clown: Blacklisted channel',
                value: author,
                inline: true,
            },
            {
                name: ':bookmark_tabs: Reason',
                value: reason,
                inline: true,
            },
        ],
    }));
}
function notifyTranslatorNotFound(intr) {
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(':warning: Translator data not found.'));
}
//# sourceMappingURL=blacklist.js.map