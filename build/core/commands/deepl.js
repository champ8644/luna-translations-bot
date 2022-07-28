"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepl = void 0;
const functions_1 = require("../db/functions");
const discord_1 = require("../../helpers/discord");
const common_tags_1 = require("common-tags");
const builders_1 = require("@discordjs/builders");
const description = "Toggles automatic DeepL translation for Hololive members' chat messages. (Also affects /cameos)";
exports.deepl = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Relay',
        description,
    },
    slash: new builders_1.SlashCommandBuilder().setName('deepl').setDescription(description),
    callback: (intr) => {
        (0, functions_1.toggleSetting)({
            intr,
            setting: 'deepl',
            enable: `
        ${discord_1.emoji.deepl} I will now translate Vtubers' messages with DeepL.
      `,
            disable: (0, common_tags_1.oneLine) `
        ${discord_1.emoji.deepl} I will no longer translate Vtubers' messages
        with DeepL.
      `,
        });
    },
};
//# sourceMappingURL=deepl.js.map