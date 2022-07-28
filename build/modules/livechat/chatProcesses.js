"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChatProcess = exports.chatProcessExists = exports.getChatProcess = void 0;
const masterchat_1 = require("masterchat");
/** Returns a singleton of the chat process for a given video ID */
function getChatProcess(videoId, channelId) {
    return (chatProcesses[videoId] ??= new masterchat_1.Masterchat(videoId, channelId, { mode: 'live' }));
}
exports.getChatProcess = getChatProcess;
function chatProcessExists(videoId) {
    return chatProcesses[videoId] != undefined;
}
exports.chatProcessExists = chatProcessExists;
function deleteChatProcess(videoId) {
    delete chatProcesses[videoId];
}
exports.deleteChatProcess = deleteChatProcess;
const chatProcesses = {};
//# sourceMappingURL=chatProcesses.js.map