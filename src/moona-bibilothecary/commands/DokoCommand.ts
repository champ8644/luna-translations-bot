import { Message } from 'discord.js';

import moonaEmoji from '../config/moonaEmoji';
import { DEV, version } from '../config/secrets';
import { Command, CommandInterface } from './commandInterface';

export class DokoCommand extends Command implements CommandInterface {
  commandNames = ["doko", "doko?"];

  alias(): string {
    return this.commandNames.join(" | ");
  }

  help(): string {
    return this.helpText("test if Moona Library is online");
  }

  async run(message: Message): Promise<void> {
    if (!message.deleted) {
      message.react(moonaEmoji.approb);
      message.reply(`v${version}${DEV ? "_DEV" : ""} koko`);
    }
  }
}
