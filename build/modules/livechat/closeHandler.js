"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAndForgetHistory = exports.retryIfStillUpThenPostLog = void 0;
const functions_1 = require("../../core/db/functions");
const helpers_1 = require("../../helpers");
const discord_1 = require("../../helpers/discord");
const frames_1 = require("../holodex/frames");
const chatProcesses_1 = require("./chatProcesses");
const chatRelayer_1 = require("./chatRelayer");
async function retryIfStillUpThenPostLog(frame, errorCode) {
    const allFrames = await (0, frames_1.getFrameList)();
    const isStillOn = allFrames?.some((frame_) => frame_.id === frame.id);
    const isMembersOnly = errorCode === 'membersOnly';
    const isDisabled = errorCode === 'disabled';
    (0, chatProcesses_1.deleteChatProcess)(frame.id);
    if (retries[frame.id]?.[1] === 'upcoming' && frame.status === 'live')
        delete retries[frame.id];
    retries[frame.id] = [(retries[frame.id]?.[0] ?? 0) + 1, frame.status];
    setTimeout(() => delete retries[frame.id], 600000);
    if (isStillOn && retries[frame.id]?.[0] <= 15 && !isMembersOnly && !isDisabled && errorCode) {
        (0, helpers_1.debug)(`masterchat exited on ${frame.id}, trying to reconnect in 5s`);
        setTimeout(() => (0, chatRelayer_1.setupRelay)(frame), 2000);
    }
    else {
        if (errorCode) {
            (0, helpers_1.log)(`${frame.status} ${frame.id} closed with mc error code: ${errorCode}`);
        }
        else {
            (0, helpers_1.log)(`${frame.status} ${frame.id} closed with unrecognized error.`);
        }
        delete retries[frame.id];
        sendAndForgetHistory(frame.id);
    }
}
exports.retryIfStillUpThenPostLog = retryIfStillUpThenPostLog;
////////////////////////////////////////////////////////////////////////////////
const retries = {};
async function sendAndForgetHistory(videoId) {
    const relevantHistories = (0, functions_1.getAllRelayHistories)()
        .map((history) => history.get(videoId))
        .filter(helpers_1.isNotNil);
    relevantHistories.forEach(async (history, gid) => {
        const g = (0, functions_1.getSettings)(gid);
        const setCh = (0, discord_1.findTextChannel)(g.logChannel);
        const ch = (0, discord_1.findTextChannel)(history[0].discordCh);
        const thread = (0, chatRelayer_1.findFrameThread)(videoId, g, ch);
        const start = await (0, frames_1.getStartTime)(videoId);
        const tlLog = (0, functions_1.filterAndStringifyHistory)(gid, history, start);
        (0, functions_1.deleteRelayHistory)(videoId, gid);
        (0, discord_1.send)(setCh ?? thread ?? ch, {
            content: `Here is this stream's TL log. <https://youtu.be/${videoId}>`,
            files: [{ attachment: Buffer.from(tlLog), name: `${videoId}.txt` }],
        });
    });
}
exports.sendAndForgetHistory = sendAndForgetHistory;
//# sourceMappingURL=closeHandler.js.map