import { Message } from 'discord.js';

import config from '../config/botConfig';

export interface CommandInterface {
  /**
   * List of aliases for the command.
   * The first name in the list is the primary command name.
   */
  readonly commandNames: string[];

  readonly args: {
    name: string;
    type?: string;
    description: string;
  }[];

  readonly prefix: string;

  /** Usage documentation. */
  help(): string;

  alias(): string;

  argList(): string;

  helpText(suffix: string): string;

  /** Execute the command. */
  run(parsedUserCommand: Message, args: Array<string>): Promise<void>;
}

export class Command {
  commandNames: string[] = [];
  args: {
    name: string;
    type?: string;
    description: string;
  }[] = [];
  prefix: string = config.prefix;
  alias(): string {
    return this.commandNames.join(" | ");
  }
  argList(): string {
    return this.args.map((arg) => `<${arg.name}>`).join(" ");
  }
  helpText(suffix: string): string {
    return `Use "${this.prefix} ${this.commandNames[0]}" to ${suffix}.`;
  }
}
