"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const discord_1 = require("../../helpers/discord");
const frames_1 = require("../../modules/holodex/frames");
const functions_1 = require("../db/functions");
const builders_1 = require("@discordjs/builders");
const description = 'Posts the archived relay log for a given video ID.';
exports.log = {
    config: {
        permLevel: 0,
    },
    help: {
        category: 'Relay',
        description,
    },
    slash: new builders_1.SlashCommandBuilder()
        .setName('log')
        .setDescription(description)
        .addStringOption((option) => option.setName('videoid').setDescription('Video ID').setRequired(true)),
    callback: async (intr) => {
        const videoId = intr.options.getString('videoid');
        const history = await (0, functions_1.getRelayHistory)(videoId);
        const processMsg = !history ? notifyLogNotFound : sendLog;
        processMsg(intr, videoId, history);
    },
};
function notifyLogNotFound(intr, videoId) {
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(`Log not found for ${videoId}`));
}
async function sendLog(intr, videoId, history) {
    const start = await (0, frames_1.getStartTime)(videoId);
    const tlLog = (0, functions_1.filterAndStringifyHistory)(intr, history, start);
    (0, discord_1.send)(intr.channel, {
        content: `Here is the TL log for <https://youtu.be/${videoId}>`,
        files: [{ attachment: Buffer.from(tlLog), name: `${videoId}.txt` }],
    });
}
//# sourceMappingURL=log.js.map