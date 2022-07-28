"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyRoleList = void 0;
const discord_1 = require("../../../helpers/discord");
const _1 = require("./");
const helpers_1 = require("../../../helpers");
function modifyRoleList(opts) {
    const g = (0, _1.getSettings)(opts.intr);
    const isNew = !g[opts.type].includes(opts.role);
    const modify = (0, helpers_1.match)(opts.verb, {
        add: isNew ? addRole : notifyNotNew,
        remove: !isNew ? removeRole : notifyNotFound,
    });
    modify({ ...opts, g });
}
exports.modifyRoleList = modifyRoleList;
///////////////////////////////////////////////////////////////////////////////
const validVerbs = ['add', 'remove'];
function addRole(opts) {
    const newRoles = [...opts.g[opts.type], opts.role];
    (0, _1.updateSettings)(opts.intr, { [opts.type]: newRoles });
    (0, discord_1.reply)(opts.intr, (0, discord_1.createEmbedMessage)(`
    :white_check_mark: <@&${opts.role}> was added to the ${opts.type} list.
    ${getRoleList(newRoles)}
  `));
}
async function removeRole(opts) {
    const newRoles = opts.g[opts.type].filter((id) => id !== opts.role);
    (0, _1.updateSettings)(opts.intr, { [opts.type]: newRoles });
    (0, discord_1.reply)(opts.intr, (0, discord_1.createEmbedMessage)(`
    :white_check_mark: <@&${opts.role}> was removed from the ${opts.type} list.
    ${getRoleList(newRoles)}
  `));
}
function notifyNotNew(opts) {
    (0, discord_1.reply)(opts.intr, (0, discord_1.createEmbedMessage)(`
    :warning: <@&${opts.role}> already in the ${opts.type} list.
    ${getRoleList(opts.g[opts.type])}
  `));
}
function notifyNotFound(opts) {
    (0, discord_1.reply)(opts.intr, (0, discord_1.createEmbedMessage)(`
    :warning: <@&${opts.role}> not found in the current ${opts.type} list.
    ${getRoleList(opts.g[opts.type])}
  `));
}
function getRoleList(roles) {
    return `**Current**: ${roles.map((id) => '<@&' + id + '>').join(' ')}`;
}
//# sourceMappingURL=roles.js.map