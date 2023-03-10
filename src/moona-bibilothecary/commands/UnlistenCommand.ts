import { Message } from 'discord.js';

import client from '../client';
import SQL from '../database/SQL';
import { Command, CommandInterface } from './commandInterface';

export class UnListenCommand extends Command implements CommandInterface {
  commandNames = ['unlisten', 'clear', 'u'];
  args = [
    {
      name: 'bot_id',
      type: 'string - id of the bot you want to clear',
      description: 'Speficy the bot ID',
    },
  ];

  help(): string {
    return this.helpText('Clear listener to bot ID in this channel');
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    const [, botId] = args;
    if (botId && !/^\d{18}$/.test(botId)) throw 'Invalid bot id';
    const payload = { channelId: message.channelId, botId };
    const res = await SQL.selectFromEqual('channel_info', ['botId'], payload);
    if (payload.botId) {
      const name = (await client.users.fetch(payload.botId)).username;
      if (!res.rowCount) throw `There is currently no subscription of "${name}."`;
      await SQL.deleteFromEqual('channel_info', payload);

      await message.reply(`\`\`\`Done clearing listener from "${name}."\`\`\``);
    } else {
      if (!res.rowCount) throw `There is currently no subscription in this channel.`;
      await SQL.deleteFromEqual('channel_info', payload);

      await message.reply(`\`\`\`Done clearing all listener from this channel.\`\`\``);
    }
  }
}
