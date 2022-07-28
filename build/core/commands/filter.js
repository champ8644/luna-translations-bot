"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = void 0;
const discord_1 = require("../../helpers/discord");
const functions_1 = require("../db/functions");
const common_tags_1 = require("common-tags");
const builders_1 = require("@discordjs/builders");
const description = 'Manage custom-banned strings and custom-desired strings.';
exports.filter = {
    config: {
        permLevel: 1,
    },
    help: {
        category: 'Relay',
        description: 'Manage custom-banned strings and custom-desired strings.',
    },
    slash: new builders_1.SlashCommandBuilder()
        .setName('filter')
        .setDescription(description)
        .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('add pattern to pattern-blacklist')
        .addStringOption((option) => option.setName('pattern').setDescription('pattern').setRequired(true)))
        .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('remove pattern from pattern-blacklist')
        .addStringOption((option) => option.setName('pattern').setDescription('pattern').setRequired(true))),
    callback: (intr) => {
        const str = intr.options.getString('pattern');
        const g = (0, functions_1.getSettings)(intr);
        const feature = 'customBannedPatterns';
        const current = g[feature];
        const verb = intr.options.getSubcommand(true);
        const isPatternValid = verb === 'add' ? current.every((s) => s !== str) : current.find((s) => s === str);
        const modifyIfValid = isPatternValid ? modifyList : notifyInvalidPattern;
        modifyIfValid({
            intr,
            type: 'blacklist',
            verb,
            pattern: str,
            g,
        });
    },
};
///////////////////////////////////////////////////////////////////////////////
const validLists = ['blacklist', 'whitelist'];
const validVerbs = ['add', 'remove'];
async function modifyList(opts) {
    const feature = opts.type === 'blacklist' ? 'customBannedPatterns' : 'customWantedPatterns';
    const current = opts.g[feature];
    const edited = opts.verb === 'add' ? [...current, opts.pattern] : current.filter((s) => s !== opts.pattern);
    (0, functions_1.updateSettings)(opts.intr, { [feature]: edited });
    (0, discord_1.reply)(opts.intr, (0, discord_1.createEmbed)({
        fields: [
            {
                name: 'Success',
                value: (0, common_tags_1.oneLine) `
      ${opts.pattern} was ${opts.verb === 'add' ? 'added to' : 'removed from'}
      the ${opts.type}.
    `,
            },
            ...createListFields(opts.type === 'whitelist' ? edited : opts.g.customWantedPatterns, opts.type === 'blacklist' ? edited : opts.g.customBannedPatterns),
        ],
    }));
}
function notifyInvalidPattern(opts) {
    (0, discord_1.reply)(opts.intr, (0, discord_1.createEmbed)({
        fields: [
            {
                name: 'Failure',
                value: (0, common_tags_1.oneLine) `
      ${opts.pattern} was ${opts.verb === 'add' ? 'already' : 'not found'}
      in the ${opts.type}.
    `,
            },
            ...createListFields(opts.g.customWantedPatterns, opts.g.customBannedPatterns),
        ],
    }));
}
function createListFields(whitelist, blacklist) {
    return [
        {
            name: 'Current whitelist',
            value: whitelist.join(', ') || '*Nothing yet*',
            inline: false,
        },
        {
            name: 'Current blacklist',
            value: blacklist.join(', ') || '*Nothing yet*',
            inline: false,
        },
    ];
}
//# sourceMappingURL=filter.js.map