"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSupported = exports.replyStreamerList = exports.getTwitterUsername = exports.findStreamerName = exports.getStreamerList = exports.twitters = exports.names = exports.streamersYtIdSet = exports.streamersMap = exports.streamers = void 0;
/** @file Exports main streamer list and streamer-related utility functions */
const discord_js_1 = require("discord.js");
const helpers_1 = require("../../../helpers");
const discord_1 = require("../../../helpers/discord");
const isekai_1 = require("./isekai");
const legends_1 = require("./legends");
const pixela_1 = require("./pixela");
exports.streamers = StreamerArray([
    // ...hololive,
    // ...nijisanji,
    // ...indies,
    ...isekai_1.isekai,
    ...pixela_1.pixela,
    ...legends_1.legends,
]);
exports.streamersMap = new Map(exports.streamers.map((s) => [s.ytId, s]));
exports.streamersYtIdSet = new Set(exports.streamers.map((s) => s.ytId));
exports.names = exports.streamers.map((x) => x.name);
exports.twitters = exports.streamers.map((x) => x.twitter);
function getStreamerList() {
    return exports.streamers.map((streamer) => streamer.name).join(', ');
}
exports.getStreamerList = getStreamerList;
function findStreamerName(name) {
    const bySubname = exports.streamers.find((s) => s.name.split(' ').some((word) => (0, helpers_1.ciEquals)(word, name)));
    const byFullName = exports.streamers.find((s) => s.name === name);
    const byAlias = exports.streamers.find((s) => s.aliases?.some((a) => (typeof a === 'string' ? (0, helpers_1.ciEquals)(a, name) : name.match(a))));
    const streamer = bySubname ?? byFullName ?? byAlias;
    return name === 'all' ? 'all' : streamer?.name;
}
exports.findStreamerName = findStreamerName;
function getTwitterUsername(streamer) {
    return exports.streamers.find((x) => x.name === streamer)?.twitter ?? 'PixelaProject';
}
exports.getTwitterUsername = getTwitterUsername;
function replyStreamerList(x) {
    const msg = x instanceof discord_js_1.CommandInteraction ? x : x.intr;
    (0, discord_1.reply)(msg, (0, discord_1.createEmbed)({
        title: 'Supported channels',
        description: getStreamerList(),
    }));
}
exports.replyStreamerList = replyStreamerList;
function isSupported(ytId) {
    return exports.streamers.some((streamer) => streamer.ytId === ytId);
}
exports.isSupported = isSupported;
//////////////////////////////////////////////////////////////////////////////
/**
 * This constrained identity function validates array without typing it
 * so that we may use 'as const' on the array
 **/
function StreamerArray(arr) {
    return arr;
}
// type stringOrRegex = string | RegExp
//# sourceMappingURL=index.js.map