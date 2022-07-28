"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processComments = void 0;
const helpers_1 = require("../../helpers");
const streamers_1 = require("../../core/db/streamers");
const discord_1 = require("../../helpers/discord");
const deepl_1 = require("../deepl");
const commentBooleans_1 = require("./commentBooleans");
const masterchat_1 = require("masterchat");
exports.default = (input) => {
    allEntries = input.allEntries;
    let wentLive = false;
    input.port.on('message', (msg) => {
        // TODO: refine any
        if (msg._tag === 'EntryUpdate') {
            allEntries = msg.entries;
        }
        if (msg._tag === 'FrameUpdate') {
            // TODO: don't mutate input
            if (msg.status === 'live') {
                wentLive = true;
                chat.stop();
                input.port.postMessage({ _tag: 'EndTask', frame: input.frame, wentLive });
            }
            input.frame.status = msg.status;
        }
    });
    if (input.frame.status === 'live')
        return;
    const chat = new masterchat_1.Masterchat(input.frame.id, input.frame.channel.id, { mode: 'live' });
    chat.on('chats', async (chats) => {
        const cmtTasks = await processComments(input.frame, toChatComments(chats));
        cmtTasks.forEach((task) => input.port.postMessage(task));
    });
    chat.on('error', (err) => input.port.postMessage({
        _tag: 'EndTask',
        frame: input.frame,
        errorCode: err instanceof masterchat_1.MasterchatError ? err.code : undefined,
    }));
    chat.on('end', () => {
        input.port.postMessage({
            _tag: 'EndTask',
            frame: input.frame,
            wentLive,
        });
    });
    chat.listen({ ignoreFirstResponse: true });
};
///////////////////////////////////////////////////////////////////////////////
let allEntries = [];
function toChatComments(chats) {
    return chats.map((chat) => ({
        id: chat.authorChannelId,
        name: chat.authorName,
        body: (0, masterchat_1.runsToString)(chat.rawMessage, { spaces: true }),
        time: chat.timestamp.getTime(),
        isMod: chat.isModerator,
        isOwner: chat.isOwner,
    }));
}
async function processComments(frame, cmts, entrs) {
    const tasks = await Promise.all(cmts.flatMap(async (cmt) => {
        const isTl_ = cmt.isTl || (0, commentBooleans_1.isTl)(cmt.body);
        const isStreamer_ = cmt.isV || (0, commentBooleans_1.isStreamer)(cmt.id);
        const streamer = streamers_1.streamersMap.get(frame.channel.id);
        const author = streamers_1.streamersMap.get(cmt.id);
        const isCameo = isStreamer_ && !cmt.isOwner;
        const mustDeepL = isStreamer_ && !(0, commentBooleans_1.isHoloID)(streamer);
        const deepLTl = mustDeepL ? await (0, deepl_1.tl)(cmt.body) : undefined;
        const mustShowTl = mustDeepL && deepLTl !== cmt.body;
        const maybeGossip = isStreamer_ || isTl_;
        const entries = (entrs ?? allEntries).filter(([{}, {}, f, e]) => [(f === 'cameos' ? author : streamer)?.name, 'all'].includes(e.streamer) ||
            f === 'gossip');
        const mustSave = isTl_ || isStreamer_;
        const saveTask = {
            _tag: 'SaveMessageTask',
            comment: cmt,
            frame,
            type: 'bot',
        };
        const sendTasks = entries
            .map(([g, bl, f, e]) => {
            const getTask = (0, helpers_1.match)(f, {
                cameos: isCameo ? relayCameo : helpers_1.doNothing,
                gossip: maybeGossip ? relayGossip : helpers_1.doNothing,
                relay: relayTlOrStreamerComment,
            });
            return getTask({
                e,
                bl,
                cmt,
                frame,
                g,
                discordCh: e.discordCh,
                deepLTl: mustShowTl ? deepLTl : undefined,
                to: streamer?.name ?? 'Discord',
            });
        })
            .filter((x) => x !== undefined);
        return [...sendTasks, ...(mustSave ? [saveTask] : [])];
    }));
    return tasks.flat();
}
exports.processComments = processComments;
function relayCameo({ discordCh, to, cmt, deepLTl, frame, g }, isGossip) {
    const cleaned = cmt.body.replaceAll('`', "'");
    const stalked = streamers_1.streamers.find((s) => s.ytId === cmt.id);
    const groups = stalked?.groups;
    const camEmj = groups?.includes('Nijisanji') ? discord_1.emoji.niji : discord_1.emoji.holo;
    const emj = isGossip ? discord_1.emoji.peek : camEmj;
    const mustTl = deepLTl && g.deepl;
    const line1 = `${emj} **${cmt.name}** in **${to}**'s chat: \`${cleaned}\``;
    const line2 = mustTl ? `\n${discord_1.emoji.deepl}**DeepL:** \`${deepLTl}\`` : '';
    const line3 = `\n<https://youtu.be/${frame.id}>`;
    return {
        _tag: 'SendMessageTask',
        cid: discordCh,
        content: line1 + line2 + line3,
        tlRelay: false,
        vId: frame.id,
        g: g,
    };
}
function relayGossip(data) {
    const stalked = streamers_1.streamers.find((s) => s.name === data.e.streamer);
    return stalked && isGossip(data.cmt, stalked, data.frame) ? relayCameo(data, true) : undefined;
}
function relayTlOrStreamerComment({ discordCh, bl, deepLTl, cmt, g, frame, }) {
    const isATl = cmt.isTl || (0, commentBooleans_1.isTl)(cmt.body, g);
    const mustPost = cmt.isOwner ||
        (isATl && !(0, commentBooleans_1.isBlacklistedOrUnwanted)(cmt, g, bl)) ||
        (0, commentBooleans_1.isStreamer)(cmt.id) ||
        (cmt.isMod && g.modMessages && !(0, commentBooleans_1.isBlacklistedOrUnwanted)(cmt, g, bl));
    const vauthor = streamers_1.streamersMap.get(cmt.id);
    const groups = vauthor?.groups;
    const vemoji = groups?.includes('Nijisanji') ? discord_1.emoji.niji : discord_1.emoji.holo;
    const premoji = isATl ? ':speech_balloon:' : (0, commentBooleans_1.isStreamer)(cmt.id) ? vemoji : ':tools:';
    const url = frame.status === 'live'
        ? ''
        : deepLTl
            ? `\n<https://youtu.be/${frame.id}>`
            : ` | <https://youtu.be/${frame.id}>`;
    const author = isATl ? `||${cmt.name}:||` : `**${cmt.name}:**`;
    const text = cmt.body.replaceAll('`', "''");
    const tl = deepLTl && g.deepl ? `\n${discord_1.emoji.deepl}**DeepL:** \`${deepLTl}\`` : '';
    return mustPost
        ? {
            _tag: 'SendMessageTask',
            vId: frame.id,
            g,
            tlRelay: true,
            cid: discordCh,
            content: `${premoji} ${author} \`${text}\`${tl}${url}`,
            save: {
                comment: cmt,
                frame,
            },
        }
        : undefined;
}
function isGossip(cmt, stalked, frame) {
    const isOwnChannel = frame.channel.id === stalked.ytId;
    const isCollab = [stalked.twitter, stalked.ytId, stalked.name, stalked.chName].some((str) => frame.description.includes(str));
    const mentionsWatched = cmt.body
        .replace(/[,()]|'s/g, '')
        .replaceAll('-', ' ')
        .split(' ')
        .some((w) => stalked.aliases.some((a) => (0, helpers_1.ciEquals)(a, w))) ||
        stalked.aliases.some((a) => (0, helpers_1.isJp)(a) && cmt.body.includes(a));
    return !isOwnChannel && !isCollab && mentionsWatched && cmt.id !== stalked.ytId;
}
//# sourceMappingURL=chatRelayerWorker.js.map