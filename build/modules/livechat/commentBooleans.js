"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStreamer = exports.isHoloID = exports.isBlacklisted = exports.isUnwanted = exports.isBlacklistedOrUnwanted = exports.isWanted = exports.isTl = void 0;
const streamers_1 = require("../../core/db/streamers");
const tlPatterns = [
    /[\S]+ tl[:)\]\】\］]/i,
    /([(\[/\［\【]|^)(tl|eng?)[\]):\】\］]/i,
    /^[\[(](eng?|tl)/i, // TLs who forget closing bracket
];
const holoID = new Set(streamers_1.streamers.filter((s) => s.groups.some((g) => g.includes('Indonesia'))).map((s) => s.ytId));
function isTl(cmt, g) {
    return tlPatterns.some((pattern) => pattern.test(cmt)) || (g !== undefined && isWanted(cmt, g));
}
exports.isTl = isTl;
function isWanted(cmt, g) {
    return g.customWantedPatterns.some((pattern) => cmt.toLowerCase().startsWith(pattern.toLowerCase()));
}
exports.isWanted = isWanted;
function isBlacklistedOrUnwanted(cmt, g, bl) {
    return bl.has(cmt.id) || isUnwanted(cmt.body, g);
}
exports.isBlacklistedOrUnwanted = isBlacklistedOrUnwanted;
function isUnwanted(cmt, g) {
    return g.customBannedPatterns.some((pattern) => cmt.toLowerCase().includes(pattern.toLowerCase()));
}
exports.isUnwanted = isUnwanted;
function isBlacklisted(ytId, g) {
    return g.blacklist.map((x) => x.ytId).includes(ytId);
}
exports.isBlacklisted = isBlacklisted;
function isHoloID(streamer) {
    return !!streamer && holoID.has(streamer.ytId);
}
exports.isHoloID = isHoloID;
function isStreamer(ytId) {
    return streamers_1.streamersYtIdSet.has(ytId);
}
exports.isStreamer = isStreamer;
//# sourceMappingURL=commentBooleans.js.map