"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logChannel = void 0;
const builders_1 = require("@discordjs/builders");
const discord_1 = require("../../helpers/discord");
const functions_1 = require("../db/functions");
const description = 'Redirect TL logs to specified channel, or clear the setting.';
exports.logChannel = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Relay',
        description,
    },
    slash: new builders_1.SlashCommandBuilder()
        .setName('logchannel')
        .setDescription(description)
        .addChannelOption((option) => option.setName('channel').setDescription('discord channel')),
    callback: async (intr) => {
        const channel = intr.options.getChannel('channel');
        // const channelMention = intr.options.getChannel('channel')
        const channelId = channel?.id;
        const processMsg = channel == null
            ? clearSetting
            : !intr.guild?.channels?.cache.find((c) => c.id == channelId)
                ? respondInvalid
                : setLogChannel;
        processMsg(intr, channelId);
    },
};
function clearSetting(intr) {
    (0, functions_1.updateSettings)(intr, { logChannel: undefined });
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)('Logs will be posted in the relay channel.'));
}
function respondInvalid(intr) {
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(`Invalid channel supplied.`));
}
function setLogChannel(intr, channelId) {
    (0, functions_1.updateSettings)(intr, { logChannel: channelId });
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(`Logs will be posted in <#${channelId}>.`));
}
//# sourceMappingURL=logChannel.js.map