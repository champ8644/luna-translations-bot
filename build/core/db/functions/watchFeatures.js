"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubbedGuilds = exports.validateInputAndModifyEntryList = void 0;
/**
 * @file This file manages addition and removals from WatchFeatureSettings
 * via Discord command.
 **/
const discord_1 = require("../../../helpers/discord");
const language_1 = require("../../../helpers/language");
const _1 = require("./");
const streamers_1 = require("../../db/streamers/");
const guildSettings_1 = require("./guildSettings");
const ramda_1 = require("ramda");
const { isArray } = Array;
function validateInputAndModifyEntryList({ intr, verb, streamer, role, feature, add, remove, }) {
    const validatedStreamer = (0, streamers_1.findStreamerName)(streamer);
    const mustShowList = verb !== 'clear' && !validatedStreamer;
    const g = (0, _1.getSettings)(intr.guild);
    const modifyIfValid = verb === 'viewcurrent'
        ? replyCurrent
        : mustShowList
            ? streamers_1.replyStreamerList
            : modifyEntryList;
    modifyIfValid({ g, intr, feature, role, add, remove, verb, streamer: validatedStreamer });
}
exports.validateInputAndModifyEntryList = validateInputAndModifyEntryList;
function getSubbedGuilds(nameOrChannelId, features) {
    const guilds = (0, guildSettings_1.getAllSettings)();
    const streamer = streamers_1.streamers.find((s) => s.ytId === nameOrChannelId)?.name ??
        streamers_1.streamers.find((s) => s.name === nameOrChannelId)?.name;
    const feats = isArray(features) ? features : [features];
    return guilds.filter((g) => getSubs(g, feats).some((sub) => [streamer, 'all'].includes(sub)));
}
exports.getSubbedGuilds = getSubbedGuilds;
///////////////////////////////////////////////////////////////////////////////
function modifyEntryList(opts) {
    const g = (0, _1.getSettings)(opts.intr);
    const isNew = g[opts.feature].every((r) => r.discordCh != opts.intr.channel?.id || r.streamer != opts.streamer);
    const applyModification = (0, language_1.match)(opts.verb, {
        add: isNew ? addEntry : notifyNotNew,
        remove: !isNew ? removeEntry : notifyNotFound,
        clear: clearEntries,
    });
    applyModification(opts);
}
function addEntry({ g, feature, intr, streamer, role, add }) {
    const newEntries = [
        ...g[feature],
        {
            streamer,
            discordCh: intr.channel.id,
            ...(role ? { roleToNotify: role } : {}),
        },
    ];
    (0, _1.updateSettings)(intr, { [feature]: newEntries });
    (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
        fields: [
            {
                name: add.success,
                value: streamer,
                inline: true,
            },
            {
                name: `${discord_1.emoji.discord} In channel`,
                value: `<#${intr.channel?.id}>`,
                inline: true,
            },
            ...(role
                ? [
                    {
                        name: `${discord_1.emoji.ping} @mentioning`,
                        value: `<@&${role}>`,
                        inline: true,
                    },
                ]
                : []),
            ...getEntryFields(newEntries),
        ],
    }, false));
}
function replyCurrent({ g, feature, intr, streamer, role, add }) {
    const newEntries = [
        ...g[feature],
    ];
    (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
        description: 'Current',
        fields: [
            ...getEntryFields(newEntries),
        ],
    }, false));
}
function removeEntry({ feature, intr, streamer, remove, g }) {
    const newEntries = g[feature].filter((r) => r.discordCh !== intr.channel.id || r.streamer !== streamer);
    (0, _1.updateSettings)(intr, { [feature]: newEntries });
    (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
        fields: [
            {
                name: remove.success,
                value: streamer,
                inline: true,
            },
            {
                name: `${discord_1.emoji.discord} In channel`,
                value: `<#${intr.channel.id}>`,
                inline: true,
            },
            ...getEntryFields(newEntries),
        ],
    }, false));
}
function notifyNotNew({ intr, add, g, feature }) {
    (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
        description: add.failure,
        fields: getEntryFields(g[feature]),
    }, false));
}
function notifyNotFound({ intr, remove, g, feature }) {
    (0, discord_1.reply)(intr, (0, discord_1.createEmbed)({
        fields: [
            {
                name: 'Error',
                value: remove.failure,
                inline: false,
            },
            ...getEntryFields(g[feature]),
        ],
    }, false));
}
async function clearEntries({ feature, intr }) {
    (0, _1.updateSettings)(intr, { [feature]: [] });
    (0, discord_1.reply)(intr, (0, discord_1.createEmbedMessage)(`Cleared all entries for ${feature}.`));
}
function getEntryFields(entries) {
    return getEntryList(entries).map((list) => ({
        name: 'Currently relayed',
        value: list || 'No one',
        inline: false,
    }));
}
/** Returns an array of embed-sized strings */
function getEntryList(entries, linesPerChunk = 20) {
    const lines = entries.map((x) => x.roleToNotify
        ? `${x.streamer} in <#${x.discordCh}> @mentioning <@&${x.roleToNotify}>`
        : `${x.streamer} in <#${x.discordCh}>`);
    const chunks = (0, ramda_1.splitEvery)(linesPerChunk)(lines);
    return chunks.map((chunk) => chunk.join('\n'));
}
function getSubs(g, fs) {
    return fs.flatMap((f) => g[f].map((entry) => entry.streamer));
}
//# sourceMappingURL=watchFeatures.js.map