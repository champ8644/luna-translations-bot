import { CommandInteraction } from 'discord.js';

import { createEmbedMessage, reply } from '../../../helpers/discord';
import { SettingToggle } from '../models/GuildSettings';
import { getSettings, updateGuildSettings } from './guildSettings';

export async function toggleSetting(props: ToggleProps): Promise<void> {
  const settings = getSettings(props.intr);
  const current = settings[props.setting];
  const notice = current === true ? props.disable : props.enable;

  await updateGuildSettings(props.intr, { [props.setting]: !current });
  reply(props.intr, createEmbedMessage(notice));
}

///////////////////////////////////////////////////////////////////////////////

interface ToggleProps {
  intr: CommandInteraction;
  setting: SettingToggle;
  enable: string;
  disable: string;
}
