"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snowflakeToUnix = exports.canBot = exports.validateRole = exports.isBot = exports.mentionsMe = exports.getGuildId = exports.hasKickPerms = exports.getUserId = exports.isBotOwner = exports.isGuildOwner = exports.hasRole = exports.isDm = exports.isMember = exports.isMessage = exports.isGuild = exports.findTextChannel = void 0;
/** @file Generic Discord.js helper functions applicable to any bot. */
const config_1 = require("../../config");
const discord_js_1 = require("discord.js");
const core_1 = require("../../core");
function findTextChannel(id) {
    const ch = core_1.client.channels.cache.get(id ?? '');
    const valid = [discord_js_1.TextChannel, discord_js_1.ThreadChannel].some((type) => ch instanceof type);
    return valid ? ch : undefined;
}
exports.findTextChannel = findTextChannel;
function isGuild(scrutinee) {
    return scrutinee instanceof discord_js_1.Guild;
}
exports.isGuild = isGuild;
function isMessage(scrutinee) {
    return scrutinee instanceof discord_js_1.Message;
}
exports.isMessage = isMessage;
function isMember(scrutinee) {
    return scrutinee instanceof discord_js_1.GuildMember;
}
exports.isMember = isMember;
function isDm(msg) {
    return msg.guild === undefined;
}
exports.isDm = isDm;
function hasRole(x, role) {
    const user = x instanceof discord_js_1.CommandInteraction ? x.member : x;
    return Array.isArray(user.roles)
        ? user.roles.includes(role)
        : user?.roles.cache.has(role);
}
exports.hasRole = hasRole;
function isGuildOwner(scrutinee) {
    return getUserId(scrutinee) === scrutinee.guild?.ownerId;
}
exports.isGuildOwner = isGuildOwner;
function isBotOwner(scrutinee) {
    return getUserId(scrutinee) === config_1.config.ownerId;
}
exports.isBotOwner = isBotOwner;
function getUserId(subject) {
    return subject instanceof discord_js_1.CommandInteraction ? subject.user.id : subject.id;
}
exports.getUserId = getUserId;
function hasKickPerms(subject) {
    const author = subject instanceof discord_js_1.CommandInteraction ? subject.member : subject;
    return author?.permissions.has('KICK_MEMBERS');
}
exports.hasKickPerms = hasKickPerms;
function getGuildId(subject) {
    console.log(subject);
    return subject instanceof discord_js_1.CommandInteraction
        ? subject.guildId ?? undefined
        : isGuild(subject)
            ? subject.id
            : subject.guild.id;
}
exports.getGuildId = getGuildId;
function mentionsMe(msg) {
    const mentionRegex = new RegExp(`^<@!?${core_1.client.user.id}>`);
    return Boolean(msg.content.match(mentionRegex));
}
exports.mentionsMe = mentionsMe;
function isBot(msg) {
    return Boolean(msg.author?.bot);
}
exports.isBot = isBot;
function validateRole(g, role) {
    return g.roles.cache.get(role?.replace(/[<@&>]/g, ''))?.id;
}
exports.validateRole = validateRole;
function canBot(perm, channel) {
    const unsupported = [discord_js_1.DMChannel];
    const isSupported = unsupported.every((type) => !(channel instanceof type));
    const validated = channel;
    return (isSupported && !!validated?.guild.me && validated.permissionsFor(validated.guild.me).has(perm));
}
exports.canBot = canBot;
function snowflakeToUnix(snowflake) {
    return new Date(Number(snowflake) / 4194304 + 1420070400000).getTime();
}
exports.snowflakeToUnix = snowflakeToUnix;
//# sourceMappingURL=general.js.map