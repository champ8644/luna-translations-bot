import { Message } from 'discord.js';

import korotaggerInfo from '../config/korotaggerInfo';
import { Command, CommandInterface } from './commandInterface';

export class SetPostLocationCommand
  extends Command
  implements CommandInterface
{
  commandNames = ["set", "s"];
  args = [
    {
      name: "karaoke | log",
      description: "Set the location of karaoke or log location",
    },
  ];

  help(): string {
    return this.helpText("Set location for posting karaoke in this channel");
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    const [, type] = args;
    switch (type) {
      case "log":
        await korotaggerInfo.setLog(message);
        break;
      case "karaoke":
      default:
        await korotaggerInfo.setPost(message);
    }
  }
}
