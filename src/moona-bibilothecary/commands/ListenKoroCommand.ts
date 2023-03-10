import { Message } from 'discord.js';

import client from '../client';
import SQL from '../database/SQL';
import { Command, CommandInterface } from './commandInterface';

export class ListenKoroCommand extends Command implements CommandInterface {
  commandNames = ["listen", "l"];
  args = [
    {
      name: "bot_id",
      type: "string - id of the bot you want to listen",
      description: "Speficy the bot ID",
    },
  ];

  help(): string {
    return this.helpText("Add listener to bot ID in this channel");
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    const [, botId] = args;
    if (!botId) throw "Please specify post's ID.";
    if (!/^\d{18}$/.test(botId)) throw "Invalid bot id";
    const payload = { type: "listen_bot", channelId: message.channelId, botId };
    const res = await SQL.selectFromEqual("channel_info", ["botId"], payload);
    const name = (await client.users.fetch(payload.botId)).username;
    if (res.rowCount) throw `Already subscribed to "${name}"`;
    await SQL.insertInto(
      "channel_info",
      ["botId", "channelId", "type"],
      payload
    );
    
      await message.reply(
        `\`\`\`Listening to korotag output from "${name}"\`\`\``
      );
 
}
