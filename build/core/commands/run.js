"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const util_1 = require("util");
const config_1 = require("../../config");
const lunaBotClient_1 = require("../lunaBotClient"); // for eval scope
const functions_1 = require("../db/functions");
const tryCatch_1 = require("../../helpers/tryCatch");
const sendMessages_1 = require("../../helpers/discord/sendMessages");
const builders_1 = require("@discordjs/builders");
exports.run = {
    config: {
        permLevel: 10,
    },
    help: {
        category: 'System',
        description: 'Evaluates arbitrary JS.',
    },
    slash: new builders_1.SlashCommandBuilder()
        .setName('run')
        .setDescription('run')
        .addStringOption((option) => option.setName('code').setDescription('code').setRequired(true)),
    callback: async (intr) => {
        const output = await processCode(intr, intr.options.getString('code'));
        (0, sendMessages_1.reply)(intr, undefined, '```js\n' + output + '\n```');
    },
};
///////////////////////////////////////////////////////////////////////////////
async function processCode(intr, code) {
    // keep imports in eval scope via _
    const _ = { client: lunaBotClient_1.client, intr, getSettings: functions_1.getSettings, updateSettings: functions_1.updateSettings, getGuildData: functions_1.getGuildData, updateGuildData: functions_1.updateGuildData };
    const evaled = await (0, tryCatch_1.tryOrDefault)(() => eval(code), '');
    const string = toString(evaled);
    const cleaned = string
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203))
        .replaceAll(config_1.config.token ?? '[censored]', '[censored]')
        .replaceAll(config_1.config.deeplKey ?? '[censored]', '[censored]');
    return cleaned;
}
function toString(x) {
    return typeof x === 'string' ? x : (0, util_1.inspect)(x, { depth: 1 });
}
//# sourceMappingURL=run.js.map