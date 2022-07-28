"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStartTime = exports.isPublic = exports._getFrameList = exports.__getFrameList = exports.getFrameList = void 0;
const ramda_1 = require("ramda");
const config_1 = require("../../config");
const helpers_1 = require("../../helpers");
const tryCatch_1 = require("../../helpers/tryCatch");
const { max, ceil } = Math;
let frameList = [];
setInterval(async () => {
    frameList = await __getFrameList();
}, 30000);
async function getFrameList() {
    if (frameList.length === 0)
        frameList = await __getFrameList();
    return frameList;
}
exports.getFrameList = getFrameList;
async function __getFrameList() {
    const attempt = await _getFrameList();
    if (attempt.length === 0)
        (0, helpers_1.debug)('Failed to get frames. restarting.');
    return attempt.length === 0 ? getFrameList() : attempt;
}
exports.__getFrameList = __getFrameList;
async function _getFrameList() {
    const firstPg = await getOneFramePage();
    return firstPg == undefined ? [] : firstPg.items;
}
exports._getFrameList = _getFrameList;
function isPublic(frame) {
    const patterns = [`members only`, `member's only`, `member`, `メン限`, `メンバー限定`];
    return (frame.topic_id !== 'membersonly' && !patterns.some((p) => frame.title.toLowerCase().includes(p)));
}
exports.isPublic = isPublic;
async function getStartTime(videoId) {
    // TODO: clean this up
    let attempts = 0;
    let data;
    while (attempts < 5) {
        const status = (0, helpers_1.isEven)(attempts) ? 'live' : 'past';
        data = await (0, tryCatch_1.asyncTryOrLog)(() => (0, helpers_1.getJson)(`https://holodex.net/api/v2/videos?status=${status}&include=live_info&type=stream&order=desc&id=${videoId}`, { headers: { 'X-APIKEY': config_1.config.holodexKey } }));
        if (data?.[0]?.start_actual == undefined)
            attempts += 1;
        else
            break;
    }
    return data?.[0]?.start_actual;
}
exports.getStartTime = getStartTime;
///////////////////////////////////////////////////////////////////////////////
const framesUrl = 'https://holodex.net/api/v2/live?';
const params = {
    include: 'description',
    limit: '9999',
    paginated: '1',
    max_upcoming_hours: '999999',
};
function getOneFramePage() {
    const url = framesUrl + (0, helpers_1.Params)(params);
    return (0, tryCatch_1.asyncTryOrLog)(() => (0, helpers_1.getJson)(url, {
        headers: {
            'X-APIKEY': config_1.config.holodexKey,
        },
    }));
}
async function getFramePages({ offset = 0, limit = 0 }) {
    // Use an imperative loop to delay each call so as not to spam the API
    try {
        const pages = [];
        for (const page of (0, ramda_1.range)(offset, limit + Math.ceil(limit / 10))) {
            await (0, helpers_1.sleep)(1000);
            pages.push(await (0, helpers_1.getJson)(framesUrl + (0, helpers_1.Params)({ ...params, offset: (4500 * page).toString() }), {
                headers: { 'X-APIKEY': config_1.config.holodexKey },
            }));
        }
        return pages;
    }
    catch (e) {
        (0, helpers_1.debug)(e);
        return undefined;
    }
}
//# sourceMappingURL=frames.js.map