import { Message } from 'discord.js';

import SQL from '../database/SQL';
import { matchYoutube } from '../utils/regexUtils';
import { Command, CommandInterface } from './commandInterface';

export class ResetPostingCommand extends Command implements CommandInterface {
  commandNames = ["reset", "r"];
  args = [
    {
      name: "stream_id",
      type: "string - id of the stream id / youtube links",
      description: "Speficy the bot ID",
    },
  ];

  help(): string {
    return this.helpText("Reset youtube link to be able to post karaoke again");
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    const [, streamLink] = args;
    const [, payload] = args;
    const res = matchYoutube.exec(payload);
    let streamId = payload;
    if (res) streamId = res[1];
    await SQL.updateWhere("stream_main", { isDone: false }, { streamId });
    if (!message.deleted) await message.react("🔄");
  }
}
