import { TextChannel } from 'discord.js';

import { client } from '../core/';
import { addRelayNotice, getRelayNotices, getSubbedGuilds } from '../core/db/functions';
import { GuildSettings, WatchFeature } from '../core/db/models';
import { Streamer } from '../core/db/streamers';
import { canBot, createEmbed, send } from '../helpers/discord';
import { tryOrLog } from '../helpers/tryCatch';
import { VideoId } from './holodex/frames';

export async function notifyDiscord(opts: NotifyOptions): Promise<void> {
  const { streamer, subbedGuilds, feature } = opts;
  const guilds = subbedGuilds ?? (await getSubbedGuilds(streamer?.name, feature));
  guilds.forEach((g) => notifyOneGuild(g, opts));
}

export async function notifyOneGuild(g: GuildSettings, opts: NotifyOptions): Promise<void[]> {
  const { streamer, feature, embedBody, emoji } = opts;

  const entries = g[feature].filter((ent) => ent.streamer == streamer!.name);
  const guildObj = client.guilds.cache.find((guild) => guild.id === g._id);
  const notices = await getRelayNotices(g._id);
  const announce = notices.get(opts.videoId ?? '');

  return !announce
    ? Promise.all(
        entries.map(({ discordCh, roleToNotify }) => {
          const ch = <TextChannel>guildObj?.channels.cache.find((ch) => ch.id === discordCh);
          const msgPromise = send(ch, {
            content: roleToNotify ? emoji + ' <@&' + roleToNotify + '>' : undefined,
            embeds: [
              createEmbed({
                author: { name: streamer!.name, iconURL: opts.avatarUrl },
                thumbnail: { url: opts.avatarUrl },
                description: embedBody,
                ...(opts.credits
                  ? { footer: { text: 'Relay from live frames currently powered by Holodex!' } }
                  : {}),
              }),
            ],
          }).then((msg) => {
            if (msg && feature === 'relay') {
              const ch = msg.channel as TextChannel;
              const mustThread = canBot('USE_PUBLIC_THREADS', ch) && g.threads;
              addRelayNotice(g._id, opts.videoId!, msg.id);
              if (mustThread)
                return tryOrLog(() =>
                  ch.threads?.create({
                    name: `Log ${streamer.name} ${opts.videoId}`,
                    startMessage: msg,
                    autoArchiveDuration: 1440,
                  }),
                )?.then((thread) => {
                  if (thread && canBot('MANAGE_MESSAGES', ch)) {
                    tryOrLog(() => msg.pin());
                    setTimeout(() => tryOrLog(() => msg?.unpin()), 86400000);
                  }
                });
            }
          });
          if (opts.nonEmbedText) send(ch, opts.nonEmbedText);
          return msgPromise;
        }),
      )
    : [];
}

export interface NotifyOptions {
  subbedGuilds?: GuildSettings[];
  feature: WatchFeature;
  streamer: Streamer;
  embedBody: string;
  emoji: string;
  avatarUrl: string;
  videoId?: VideoId;
  nonEmbedText?: string;
  credits?: boolean;
}
