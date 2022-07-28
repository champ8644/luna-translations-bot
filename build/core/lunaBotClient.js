"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.commands = void 0;
const discord_js_1 = require("discord.js");
const immutable_1 = require("immutable");
const worker_threads_1 = require("worker_threads");
const discord_1 = require("../helpers/discord");
exports.commands = worker_threads_1.isMainThread ? (0, discord_1.loadAllCommands)() : (0, immutable_1.Map)();
exports.client = new discord_js_1.Client({
    intents: new discord_js_1.Intents(['GUILDS']),
    retryLimit: 5,
    restRequestTimeout: 30000,
});
if (worker_threads_1.isMainThread) {
    (0, discord_1.loadAllEvents)().forEach((callback, evtName) => exports.client.on(evtName, callback));
}
//# sourceMappingURL=lunaBotClient.js.map