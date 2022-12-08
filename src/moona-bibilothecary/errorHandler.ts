import { Message } from 'discord.js';

import korotaggerInfo from './config/korotaggerInfo';
import { addCancelEmote } from './utils/addCancelEmote';

class ErrorHandler {
  async error(message: string) {
    const channelLog = await korotaggerInfo.getChannelLog();
    if (channelLog) channelLog.send(message);
    else console.error("There is no channel to be logging for ", message);
  }

  async messageError(
    message: Message,
    error: any,
    options?: { codeBlock?: boolean; language?: string; at?: string }
  ) {
    const { codeBlock, language = "", at } = options || {};
    console.error(error);
    const errorText = codeBlock
      ? `\`\`\`${language}
${at ? `Error at ${at}\n` : ""}${error}\`\`\``
      : error;
    const messageReply = await message.reply(errorText);
    addCancelEmote(message, messageReply);
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;
