"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklisters = void 0;
const roles_1 = require("../db/functions/roles");
const slash_1 = require("../../helpers/discord/slash");
const description = 'Add or remove a role to blacklisters. (Bot admins + ppl with kick perms are alr blacklisters.)';
exports.blacklisters = {
    config: {
        permLevel: 2,
    },
    help: {
        category: 'General',
        description,
    },
    slash: (0, slash_1.roleListCommand)({
        name: 'blacklisters',
        description,
        roleListName: 'the bot blacklister list',
    }),
    callback: (intr) => {
        (0, roles_1.modifyRoleList)({
            type: 'blacklisters',
            intr,
            verb: intr.options.getSubcommand(true),
            role: intr.options.getRole('role').id,
        });
    },
};
//# sourceMappingURL=blacklisters.js.map