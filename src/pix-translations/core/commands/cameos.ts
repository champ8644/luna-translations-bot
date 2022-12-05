import { oneLine } from 'common-tags';
import { CommandInteraction } from 'discord.js';

import { Command, emoji } from '../../helpers/discord';
import { notificationCommand } from '../../helpers/discord/slash';
import { validateInputAndModifyEntryList } from '../db/functions';

export const cameos: Command = {
  config: {
    permLevel: 2,
  },
  help: {
    category: 'Notifs',
    description: oneLine`
      Start or stop relaying a streamer's appearances in other
      streamers' livechat.
    `,
  },
  slash: notificationCommand({ name: 'cameos', subject: 'cameos' }),
  callback: (intr: CommandInteraction): void => {
    const streamer = intr.options.getString('channel')!;
    validateInputAndModifyEntryList({
      intr,
      verb: intr.options.getSubcommand(true) as 'add' | 'remove' | 'clear' | 'viewcurrent',
      streamer,
      role: intr.options.getRole('role')?.id,
      feature: 'cameos',
      add: {
        success: `${emoji.ataru} Relaying cameos in other chats`,
        failure: oneLine`
          :warning: ${streamer}'s cameos in other chats already being
          relayed in this channel.
        `,
      },
      remove: {
        success: `${emoji.ataru} Stopped relaying chat cameos`,
        failure: oneLine`
          :warning: ${streamer}'s cameos' weren't already being relayed
          in <#${intr.channel!.id}>. Are you in the right channel?
        `,
      },
    });
  },
};
