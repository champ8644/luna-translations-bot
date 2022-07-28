"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admins = void 0;
const roles_1 = require("../db/functions/roles");
const slash_1 = require("../../helpers/discord/slash");
const description = 'Add or remove a role to the bot admin list. (ppl w/ kick perms are alr bot admin.)';
exports.admins = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'General',
        description,
    },
    slash: (0, slash_1.roleListCommand)({
        name: 'admins',
        description,
        roleListName: 'the bot admin list',
    }),
    callback: (intr) => {
        (0, roles_1.modifyRoleList)({
            type: 'admins',
            intr,
            verb: intr.options.getSubcommand(true),
            role: intr.options.getRole('role').id,
        });
    },
};
//# sourceMappingURL=admins.js.map