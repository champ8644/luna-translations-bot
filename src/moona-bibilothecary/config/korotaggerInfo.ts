import { Message } from 'discord.js';

import client from '../client';
import SQL from '../database/SQL';

class KorotaggerInfo {
  listen: Array<{ channelId: string; botId: string }> = [];
  post: { channelId?: string } = {};
  log: { channelId?: string } = {};
  loading = true;

  constructor() {
    this.init();
  }

  async init() {
    this.loading = true;
    const { rows } = await SQL.selectFrom("channel_info");
    rows.forEach((row) => {
      switch (row.type) {
        case "postKara":
          this.post.channelId = row.channelId;
          break;
        case "listen_bot":
          this.listen.push({ channelId: row.channelId, botId: row.botId });
          break;
        case "postLog":
          this.log.channelId = row.channelId;
          break;
        default:
      }
    });
    this.loading = false;
  }

  isKoro(message: Message) {
    if (client.application?.id === message.author.id) return false;
    for (let i = 0; i < this.listen.length; i++) {
      if (
        message.channelId === this.listen[i].channelId &&
        message.author.id === this.listen[i].botId
      )
        return true;
    }
    return false;
  }

  async getChannelLog() {
    if (!this.log.channelId) return;
    const channel = await client.channels.fetch(this.log.channelId);
    if (channel?.isText()) return channel;
  }

  async setLog(message: Message): Promise<void> {
    const channelId = message.channelId;
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isText())
      throw "This channel is not text-based, please try again.";

    await SQL.deleteFromEqual("channel_info", { channelId, type: "postLog" });
    await SQL.insertInto("channel_info", ["channelId", "type"], {
      channelId,
      type: "postLog",
    });
    this.log = { channelId };
    if (!message.deleted)
      await message.reply(
        `\`\`\`Set current channel "${channelId}" as log posting location\`\`\``
      );
  }

  async getChannelPost() {
    if (!this.post.channelId) return;
    const channel = await client.channels.fetch(this.post.channelId);
    if (channel?.isText()) return channel;
  }

  async setPost(message: Message): Promise<void> {
    const channelId = message.channelId;
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isText())
      throw "This channel is not text-based, please try again.";

    await SQL.deleteFromEqual("channel_info", { channelId, type: "postKara" });
    await SQL.insertInto("channel_info", ["channelId", "type"], {
      channelId,
      type: "postKara",
    });
    this.post = { channelId };
    if (!message.deleted)
      await message.reply(
        `\`\`\`Set current channel "${channelId}" as karaoke posting location\`\`\``
      );
  }

  async addListener(message: Message, args: Array<string>): Promise<void> {
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
    this.listen.push({ botId: payload.botId, channelId: payload.channelId });
    if (!message.deleted)
      await message.reply(
        `\`\`\`Listening to korotag output from "${name}"\`\`\``
      );
  }

  async clearListener(message: Message, args: Array<string>): Promise<void> {
    const [, botId] = args;
    if (botId && !/^\d{18}$/.test(botId)) throw "Invalid bot id";
    const payload = { channelId: message.channelId, botId };
    const res = await SQL.selectFromEqual("channel_info", ["botId"], payload);
    if (payload.botId) {
      const name = (await client.users.fetch(payload.botId)).username;
      if (!res.rowCount)
        throw `There is currently no subscription of "${name}."`;
      await SQL.deleteFromEqual("channel_info", payload);
      this.listen = this.listen.filter(
        (each) =>
          each.botId !== payload.botId || each.channelId !== payload.channelId
      );
      if (!message.deleted)
        await message.reply(
          `\`\`\`Done clearing listener from "${name}."\`\`\``
        );
    } else {
      if (!res.rowCount)
        throw `There is currently no subscription in this channel.`;
      await SQL.deleteFromEqual("channel_info", payload);
      this.listen = this.listen.filter(
        (each) => each.channelId !== payload.channelId
      );
      if (!message.deleted)
        await message.reply(
          `\`\`\`Done clearing all listener from this channel.\`\`\``
        );
    }
  }
}
const korotaggerInfo = new KorotaggerInfo();
export default korotaggerInfo;
