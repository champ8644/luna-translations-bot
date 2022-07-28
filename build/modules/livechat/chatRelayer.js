"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFrameThread = exports.setupRelay = void 0;
const frames_1 = require("../holodex/frames");
const discord_1 = require("../../helpers/discord");
const functions_1 = require("../../core/db/functions");
const closeHandler_1 = require("./closeHandler");
const logging_1 = require("./logging");
const frameEmitter_1 = require("../holodex/frameEmitter");
const worker_threads_1 = require("worker_threads");
const path_1 = require("path");
const chatRelayerWorker_1 = require("./chatRelayerWorker");
const socket_io_client_1 = require("socket.io-client");
const helpers_1 = require("../../helpers");
const Piscina = require('piscina');
const piscina = new Piscina({
    filename: (0, path_1.resolve)(__dirname, 'chatRelayerWorker.js'),
    useAtomics: false,
    idleTimeout: 99999999,
});
if (worker_threads_1.isMainThread)
    frameEmitter_1.frameEmitter.on('frame', (frame) => {
        if ((0, frames_1.isPublic)(frame)) {
            if (frame.status === 'live') {
                setupLive(frame);
            }
            else {
                //setupRelay(frame)
                (0, helpers_1.log)(`${frame.id} is upcoming, not relaying`);
            }
        }
    });
const masterchats = {}; // Figure out why MessagePort type broken
async function setupRelay(frame) {
    const { port1, port2 } = new worker_threads_1.MessageChannel();
    masterchats[frame.id] = port2;
    piscina.run({ port: port1, frame, allEntries }, { transferList: [port1] });
    port2.on('message', runTask);
}
exports.setupRelay = setupRelay;
// TODO: ensure no race condition getting live frames on startup
const framesAwaitingSub = {};
const activeSubs = new Set();
const tldex = (0, socket_io_client_1.io)('wss://holodex.net', {
    path: '/api/socket.io/',
    transports: ['websocket'],
});
tldex.on('connect_error', (err) => (0, helpers_1.debug)(err));
// resubscribe on server restart
tldex.on('connect', () => {
    activeSubs.forEach((sub) => {
        tldex.emit('subscribe', { video_id: sub, lang: 'en' });
    });
});
tldex.on('subscribeSuccess', (msg) => {
    delete framesAwaitingSub[msg.id];
    activeSubs.add(msg.id);
    if (masterchats[msg.id]) {
        masterchats[msg.id].postMessage({
            _tag: 'FrameUpdate',
            status: 'live',
        });
        return;
    }
    console.log('subsucc ' + JSON.stringify(msg));
});
tldex.on('subscribeError', (msg) => {
    retries[msg.id] = (retries[msg.id] ?? 0) + 1;
    if (retries[msg.id] < 5) {
        setTimeout(() => setupLive(framesAwaitingSub[msg.id]), 30000);
    }
    else {
        delete retries[msg.id];
    }
});
tldex.onAny((evtName, ...args) => {
    // if (!evtName.includes ('/en') && evtName !== 'subscribeSuccess') {
    (0, helpers_1.debug)(evtName + ': ' + JSON.stringify(args));
    // }
});
const retries = {};
function setupLive(frame) {
    if (frame == null)
        return;
    (0, helpers_1.debug)(`setting up ${frame.status} ${frame.id} ${frame.title}`);
    framesAwaitingSub[frame.id] = frame;
    tldex.emit('subscribe', { video_id: frame.id, lang: 'en' });
    tldex.removeAllListeners?.(`${frame.id}/en`);
    tldex.on(`${frame.id}/en`, async (msg) => {
        //debug(`Received a message in ${frame.id}: ${JSON.stringify(msg)}`)
        if (msg.name) {
            const cmt = {
                id: msg.channel_id ?? 'MChad-' + msg.name,
                name: msg.name,
                body: msg.message.replace(/:http\S+( |$)/g, ':'),
                time: msg.timestamp,
                isMod: msg.is_moderator,
                isOwner: msg.channel_id === frame.channel.id,
                isTl: msg.is_tl || msg.source === 'MChad',
                isV: msg.is_vtuber,
            };
            const tasks = await (0, chatRelayerWorker_1.processComments)(frame, [cmt], allEntries);
            tasks.forEach(runTask);
        }
        else if (msg.type === 'end') {
            activeSubs.delete(frame.id);
            (0, closeHandler_1.sendAndForgetHistory)(frame.id);
        }
    });
}
///////////////////////////////////////////////////////////////////////////////
const features = ['relay', 'cameos', 'gossip'];
let allEntries = [];
async function updateEntries() {
    const guilds = (0, functions_1.getAllSettings)();
    allEntries = guilds.flatMap((g) => features.flatMap((f) => g[f].map((e) => {
        const bl = new Set(g.blacklist.map((i) => i.ytId));
        return [g, bl, f, e];
    })));
    Object.values(masterchats).forEach((port) => port.postMessage({
        _tag: 'EntryUpdate',
        entries: allEntries,
    }));
}
setInterval(updateEntries, 10000);
updateEntries();
function runTask(task) {
    if (task._tag === 'EndTask') {
        delete masterchats[task.frame.id];
        if (!task.wentLive)
            (0, closeHandler_1.retryIfStillUpThenPostLog)(task.frame, task.errorCode);
    }
    if (task._tag === 'LogCommentTask') {
        (0, logging_1.logCommentData)(task.cmt, task.frame, task.streamer);
    }
    if (task._tag === 'SaveMessageTask') {
        (0, helpers_1.log)('Saving data...');
        saveComment(task.comment, task.frame, task.type, task.msgId, task.chId);
        (0, helpers_1.log)('Done saving data.');
    }
    if (task._tag === 'SendMessageTask') {
        const ch = (0, discord_1.findTextChannel)(task.cid);
        const thread = task.tlRelay ? findFrameThread(task.vId, task.g) : null;
        (0, helpers_1.log)(`${task.vId} | ${task.content}`);
        // const lastMsg = ch?.lastMessage
        // const isBotLastPoster = lastMsg?.author?.id === client.user?.id
        // // // this code is ugly and duplicated but im in a hurry
        // if (isBotLastPoster) {
        // tryOrLog (() => {
        // lastMsg?.edit(`${lastMsg.content}\n${task.content}`)
        // .then (msg => {
        // if (task.save && msg) {
        // saveComment (
        // task.save.comment,
        // task.save.frame,
        // 'guild',
        // msg.id,
        // msg.channelId,
        // task.g._id,
        // )
        // }
        // })
        // .catch (() => {
        // send (thread ?? ch, task.content)
        // .then (msg => {
        // if (task.save && msg) {
        // saveComment (
        // task.save.comment,
        // task.save.frame,
        // 'guild',
        // msg.id,
        // msg.channelId,
        // task.g._id,
        // )
        // }
        // })
        // })
        // })
        // } else {
        (0, discord_1.send)(thread ?? ch, task.content).then((msg) => {
            if (task.save && msg) {
                saveComment(task.save.comment, task.save.frame, 'guild', msg.id, msg.channelId, task.g._id);
            }
        });
        // }
    }
}
function findFrameThread(videoId, g, channel) {
    const gdata = (0, functions_1.getGuildData)(g._id);
    const notice = gdata.relayNotices.get(videoId);
    const validch = channel;
    if (g.threads)
        return validch?.threads?.cache.find((thr) => thr.id === notice);
}
exports.findFrameThread = findFrameThread;
function saveComment(cmt, frame, type, msgId, chId, gid) {
    const addFn = type === 'guild' ? functions_1.addToGuildRelayHistory : functions_1.addToBotRelayHistory;
    const startTime = new Date(Date.parse(frame.start_actual ?? '')).valueOf();
    const loggedTime = new Date(+cmt.time).valueOf();
    const timestamp = !frame.start_actual
        ? 'prechat'
        : new Date(loggedTime - startTime).toISOString().substr(11, 8);
    addFn(frame.id, {
        msgId: msgId,
        discordCh: chId,
        body: cmt.body,
        ytId: cmt.id,
        author: cmt.name,
        timestamp,
        stream: frame.id,
        absoluteTime: cmt.time,
    }, gid);
}
//# sourceMappingURL=chatRelayer.js.map