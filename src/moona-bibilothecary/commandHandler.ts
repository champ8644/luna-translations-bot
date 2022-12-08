import { Message } from 'discord.js';
import _ from 'lodash';

import * as commands from './commands';
import { CommandInterface } from './commands/commandInterface';
import config from './config/botConfig';
import { HelpCommand } from './config/helpCommand';
import korotaggerInfo from './config/korotaggerInfo';
import errorHandler from './errorHandler';
import { CommandParser } from './models/commandParser';

export default class CommandHandler {
  private commands: CommandInterface[];
  private koroTaggerInterpreter: CommandInterface;
  private readonly prefix: string;

  constructor(prefix: string) {
    const commandClasses = [..._.values(commands), HelpCommand];
    this.commands = commandClasses.map((commandClass) => new commandClass());
    this.koroTaggerInterpreter = new commands.KoroTaggerCommand();
    this.prefix = prefix;
  }

  /** Executes user commands contained in a message if appropriate. */
  async handleMessage(message: Message): Promise<void> {
    if (!this.isCommand(message)) {
      if (korotaggerInfo.isKoro(message)) {
        await this.koroTaggerInterpreter
          .run(message, [])
          .catch(async (error) => {
            errorHandler.messageError(message, error, {
              codeBlock: true,
              language: "js",
              at: "koro_interpreter",
            });
          });
      }
      return;
    }

    const commandParser = new CommandParser(message, this.prefix);

    const matchedCommand = this.commands.find((command) =>
      command.commandNames.includes(commandParser.parsedCommandName)
    );

    if (!matchedCommand) {
      errorHandler.messageError(
        message,
        `I didn't recognize that command. Try ${config.prefix} help.`
      );
    } else {
      const args = message.content.slice(this.prefix.length).trim().split(/ +/);
      await matchedCommand.run(message, args).catch(async (error) => {
        errorHandler.messageError(message, error, {
          codeBlock: true,
          language: "js",
          at: `command: '${this.echoMessage(message)}`,
        });
      });
    }
  }

  /** Sends back the message content after removing the prefix. */
  echoMessage(message: Message): string {
    return message.content.replace(this.prefix, "").trim();
  }

  /** Determines whether or not a message is a user command. */
  private isCommand(message: Message): boolean {
    return message.content.startsWith(this.prefix);
  }
}
