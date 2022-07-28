"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mods = void 0;
const functions_1 = require("../db/functions");
const builders_1 = require("@discordjs/builders");
const description = 'Toggles the relaying of mod messages serverwide.';
exports.mods = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'Relay',
        description,
    },
    slash: new builders_1.SlashCommandBuilder().setName('mods').setDescription(description),
    callback: (intr) => {
        (0, functions_1.toggleSetting)({
            intr,
            setting: 'modMessages',
            enable: `:tools: I will now relay mod messages.`,
            disable: `
        :tools: I will no longer relay mod messages.
        (Channel owner and other Hololive members will still be relayed.)
      `,
        });
    },
};
//# sourceMappingURL=mods.js.map