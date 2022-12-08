import { Message } from 'discord.js';
import _ from 'lodash';

import * as commands from '../commands';
import { Command, CommandInterface } from '../commands/commandInterface';

export class HelpCommand extends Command implements CommandInterface {
  maxAliasLength?: number;

  commandNames = ["help", "h"];
  private finalHelpText: string;

  formatHelp(alias: string, help: string): string {
    return "  " + _.padEnd(alias, this.maxAliasLength) + "    " + help;
  }

  constructor() {
    super();
    this.maxAliasLength = _.max(
      _.values(commands).map(
        (commandClass) =>
          new commandClass().alias().length +
          1 +
          new commandClass().argList().length
      )
    );
    const commandsArr = _.sortBy(
      [
        ..._.values(commands).map((commandClass) => {
          const eachClass = new commandClass();
          return {
            alias: eachClass.alias() + " " + eachClass.argList(),
            help: eachClass.help(),
          };
        }),
        { alias: this.alias() + " " + this.argList(), help: this.help() },
      ],
      ["alias", "args", "help"]
    );
    this.finalHelpText = [
      "```",
      "Commands:",
      ...commandsArr.map(({ alias, help }) => {
        return this.formatHelp(alias, help);
      }),
      "```",
    ].join("\n");
  }

  help(): string {
    return this.helpText("list avaliable commands");
  }

  async run(message: Message): Promise<void> {
    await message.channel.send(this.finalHelpText);
  }
}
