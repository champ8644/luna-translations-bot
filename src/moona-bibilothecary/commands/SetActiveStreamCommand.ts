import { Message } from 'discord.js';
import _ from 'lodash';

import moonaEmoji from '../config/moonaEmoji';
import SQL from '../database/SQL';
import { getStreamDetails } from '../database/YoutubeQuery/getStreamDetails';
import imgur from '../imgur';
import { matchYoutube } from '../utils/regexUtils';
import { Command, CommandInterface } from './commandInterface';

export class SetActiveStreamCommand
  extends Command
  implements CommandInterface
{
  commandNames = ["active"];
  args = [
    {
      name: "type",
      type: `"execution" | "readonly" | undefined - default as execution`,
      description: "Specify type of query",
    },
    {
      name: "id",
      type: "string - yt_stream_id",
      description: "Youtube stream id in various format",
    },
  ];

  alias(): string {
    return this.commandNames.join(" | ");
  }

  help(): string {
    return this.helpText("Set active stream details instead of koro");
  }

  async run(message: Message, args: Array<string>): Promise<void> {
    const [, payload1, payload2] = args;
    let streamId: string;
    let isExecution = true;
    if (payload1 === "execution") streamId = payload2;
    else if (payload1 === "readonly") {
      streamId = payload2;
      isExecution = false;
    } else streamId = payload1;
    let res = matchYoutube.exec(streamId);
    if (res) {
      streamId = res[1];
      const streamRes = await getStreamDetails(streamId);
      await this.onKoroActiveStream(message, streamId, isExecution);
    } else {
      let json: any;
      try {
        const [, ...payloads] = args;
        const payload = payloads.join(" ");
        console.log(
          "🚀 ~ file: SetActiveStreamCommand.ts ~ line 55 ~ run ~ payload1",
          payload
        );
        json = JSON.parse(payload);
        console.log(
          "🚀 ~ file: SetActiveStreamCommand.ts ~ line 55 ~ run ~ json",
          json
        );
        this.onJSONActiveStream(message, json);
      } catch (err) {
        message.reply(`Active stream/JSON invalid`);
      }
    }
  }

  checkValidity(streamJSON: {
    streamId: string;
    isArchive: boolean;
    isKaraoke: boolean;
    isMoona: boolean;
    publishedAt: string;
    channelId: string;
    title: string;
    hashtags?: string[];
    thumbnailUrl: string;
    channelTitle: string;
    timestamp: number;
  }) {
    const defaultObj = {
      channelId: "UCP0BspO_AMEe3aQqqpo89Dg",
      channelTitle: "Moona Hoshinova hololive-ID",
      isMoona: true,
      isKaraoke: true,
    };
    const checkObj = {
      streamId: "string",
      publishedAt: "string",
      title: "string",
      thumbnailUrl: "string",
      isArchive: "boolean",
      isKaraoke: "boolean",
      timestamp: "number",
    } as const;
    _.forEach(checkObj, (val, key) => {
      if (streamJSON[key as keyof typeof checkObj] === undefined)
        throw `key ${key}:${val} is missing`;
      if (typeof streamJSON[key as keyof typeof checkObj] !== val)
        throw `${key} is not ${val}; is ${typeof streamJSON[
          key as keyof typeof checkObj
        ]}`;
    });
    return _.assign(defaultObj, streamJSON);
  }

  async onJSONActiveStream(
    message: Message,
    _streamJSON: {
      streamId: string;
      isArchive: boolean;
      isKaraoke: boolean;
      isMoona: boolean;
      publishedAt: string;
      channelId: string;
      title: string;
      hashtags?: string[];
      thumbnailUrl: string;
      channelTitle: string;
      timestamp: number;
    }
  ) {
    try {
      let streamJSON;
      try {
        streamJSON = this.checkValidity(_streamJSON);
      } catch (err) {
        message.reply(`Error parsing json: "${err}"`);
        return;
      }

      const json = await imgur.uploadUrl(streamJSON.thumbnailUrl, "VAwVpeR");
      await SQL.insertIntoUpdate(
        "stream_main",
        {
          ...streamJSON,
          thumbnailUrl: json.link,
          streamId: streamJSON.streamId,
        },
        "streamId"
      );

      if (!message.deleted) await message.react(moonaEmoji.approb);
    } catch (err) {
      console.error(err);
    }
  }

  async onKoroActiveStream(
    message: Message,
    streamId: string,
    isExecution: boolean
  ) {
    try {
      const streamRes = await getStreamDetails(streamId);
      if (!streamRes)
        return message.reply(
          `Active stream at https://www.youtube.com/watch?v=${streamId} not found`
        );
      if (isExecution) {
        const json = await imgur.uploadUrl(
          streamRes.thumbnailUrl.trim(),
          "VAwVpeR"
        );
        await SQL.insertIntoUpdate(
          "stream_main",
          { ...streamRes, thumbnailUrl: json.link, streamId },
          "streamId"
        );
      } else {
        message.reply(`\`\`\`json
${JSON.stringify(streamRes, null, 2)}\`\`\``);
      }
      if (!message.deleted) await message.react(moonaEmoji.approb);
    } catch (err) {
      console.error(err);
    }
  }
}
