import { GuildEmoji } from 'discord.js';
import _ from 'lodash';

import client from '../client';

const defaultEmoji = {
  approb: "✅",
  denied: "❌",
  edit: "⚠️",
};

const mapEmoji = {
  approb: "MoonApprob",
  denied: "MoonaNoBlushed",
  edit: "MoonaThink",
} as const;

export class MoonaEmoji {
  approb: GuildEmoji | string = defaultEmoji.approb;
  denied: GuildEmoji | string = defaultEmoji.denied;
  edit: GuildEmoji | string = defaultEmoji.edit;

  string = defaultEmoji;

  constructorAsync() {
    _.forEach(mapEmoji, (val, _key) => {
      const key = _key as keyof typeof mapEmoji;
      this[key] = client.emojis.cache.find((x) => x.name === val) || this[key];
      this.string[key] = val;
    });
  }
}

const moonaEmoji = new MoonaEmoji();

export default moonaEmoji;
