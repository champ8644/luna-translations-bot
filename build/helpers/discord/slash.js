"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationCommand = exports.channelOption = exports.roleListCommand = void 0;
const builders_1 = require("@discordjs/builders");
const roleListCommand = (opts) => new builders_1.SlashCommandBuilder()
    .setName(opts.name)
    .setDescription(opts.description)
    .addSubcommand((subcommand) => subcommand
    .setName('add')
    .setDescription(`Add a role to ${opts.roleListName}.`)
    .addRoleOption((option) => option.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName('remove')
    .setDescription(`Remove a role to ${opts.roleListName}`)
    .addRoleOption((option) => option.setName('role').setDescription('The role').setRequired(true)));
exports.roleListCommand = roleListCommand;
const channelOption = (option) => option
    .setName('channel')
    .setDescription('YouTube channel name')
    // .addChoices(streamers.map((s) => [s.name, s.name]))
    .setRequired(true);
exports.channelOption = channelOption;
const notificationCommand = (opts) => new builders_1.SlashCommandBuilder()
    .setName(opts.name)
    .setDescription(`Starts or stops sending notifications for ${opts.subject} in the current Discord channel.`)
    .addSubcommand((subcommand) => subcommand
    .setName('add')
    .setDescription(`Add a channel from which to notify ${opts.subject}`)
    .addStringOption(exports.channelOption)
    .addRoleOption((option) => option.setName('role').setDescription('role to notify')))
    .addSubcommand((subcommand) => subcommand
    .setName('remove')
    .setDescription(`Remove a channel from which to notify ${opts.subject}`)
    .addStringOption(exports.channelOption))
    .addSubcommand((subcommand) => subcommand
    .setName('clear')
    .setDescription(`Clear all channels from which to notify ${opts.subject}`))
    .addSubcommand((subcommand) => subcommand
    .setName('viewcurrent')
    .setDescription(`View currently subscribed`));
exports.notificationCommand = notificationCommand;
//# sourceMappingURL=slash.js.map