import { Snowflake } from 'discord.js';
import { AddChatItemAction, Masterchat, MasterchatError, runsToString } from 'masterchat';

import { GuildSettings, WatchFeatureSettings } from '../../core/db/models';
import { Streamer, StreamerName, streamers, streamersMap } from '../../core/db/streamers';
import { ciEquals, doNothing, isJp, match } from '../../helpers';
import { emoji } from '../../helpers/discord';
import { tl } from '../deepl';
import { DexFrame } from '../holodex/frames';
import { Blacklist, ChatComment, Entries } from './chatRelayer';
import { isBlacklistedOrUnwanted, isHoloID, isStreamer, isTl } from './commentBooleans';

export default (input: ChatWorkerInput): void => {
  allEntries = input.allEntries;
  let wentLive = false;
  input.port.on('message', (msg: any) => {
    // TODO: refine any
    if (msg._tag === 'EntryUpdate') {
      allEntries = msg.entries;
    }
    if (msg._tag === 'FrameUpdate') {
      // TODO: don't mutate input
      if (msg.status === 'live') {
        wentLive = true;
        chat.stop();
        input.port.postMessage({ _tag: 'EndTask', frame: input.frame, wentLive });
      }
      input.frame.status = msg.status;
    }
  });
  if (input.frame.status === 'live') return;
  const chat = new Masterchat(input.frame.id, input.frame.channel.id, { mode: 'live' });

  chat.on('chats', async (chats) => {
    const cmtTasks = await processComments(input.frame, toChatComments(chats));
    cmtTasks.forEach((task) => input.port.postMessage(task));
  });

  chat.on('error', (err) =>
    input.port.postMessage({
      _tag: 'EndTask',
      frame: input.frame,
      errorCode: err instanceof MasterchatError ? err.code : undefined,
    }),
  );

  chat.on('end', () => {
    input.port.postMessage({
      _tag: 'EndTask',
      frame: input.frame,
      wentLive,
    });
  });

  chat.listen({ ignoreFirstResponse: true });
};

interface ChatWorkerInput {
  port: any; // figure out why MessagePort type is broken
  frame: DexFrame;
  allEntries: Entries;
}

interface LogCommentTask {
  _tag: 'LogCommentTask';
  cmt: ChatComment;
  frame: DexFrame;
  streamer?: Streamer;
}

interface SendMessageTask {
  _tag: 'SendMessageTask';
  cid: Snowflake;
  content: string;
  tlRelay: boolean;
  vId: string;
  g: GuildSettings;
  save?: Omit<SaveMessageTask, '_tag' | 'type'>;
}

interface SaveMessageTask {
  _tag: 'SaveMessageTask';
  comment: ChatComment;
  frame: DexFrame;
  type: 'guild' | 'bot';
  msgId?: Snowflake;
  chId?: Snowflake;
}

interface EndTask {
  _tag: 'EndTask';
  frame: DexFrame;
  errorCode?: string;
  wentLive?: boolean;
}

export type Task = SendMessageTask | SaveMessageTask | LogCommentTask | EndTask;

///////////////////////////////////////////////////////////////////////////////

let allEntries: Entries = [];

function toChatComments(chats: AddChatItemAction[]): ChatComment[] {
  return chats.map((chat) => ({
    id: chat.authorChannelId,
    name: chat.authorName,
    body: runsToString(chat.rawMessage, { spaces: true }),
    time: chat.timestamp.getTime(),
    isMod: chat.isModerator,
    isOwner: chat.isOwner,
  }));
}

export async function processComments(
  frame: DexFrame,
  cmts: ChatComment[],
  entrs?: Entries,
): Promise<Task[]> {
  const tasks = await Promise.all(
    cmts.flatMap(async (cmt) => {
      const isTl_ = cmt.isTl || isTl(cmt.body);
      const isStreamer_ = cmt.isV || isStreamer(cmt.id);
      const streamer = streamersMap.get(frame.channel.id);
      const author = streamersMap.get(cmt.id);
      const isCameo = isStreamer_ && !cmt.isOwner;
      const mustDeepL = isStreamer_ && !isHoloID(streamer);
      const deepLTl = mustDeepL ? await tl(cmt.body) : undefined;
      const mustShowTl = mustDeepL && deepLTl !== cmt.body;
      const maybeGossip = isStreamer_ || isTl_;
      const entries = (entrs ?? allEntries).filter(
        ([{}, {}, f, e]) =>
          [(f === 'cameos' ? author : streamer)?.name, 'all'].includes(e.streamer) ||
          f === 'gossip',
      );

      const mustSave = isTl_ || isStreamer_;

      const saveTask: SaveMessageTask = {
        _tag: 'SaveMessageTask',
        comment: cmt,
        frame,
        type: 'bot',
      };

      const sendTasks = entries
        .map(([g, bl, f, e]) => {
          const getTask = match(f, {
            cameos: isCameo ? relayCameo : doNothing,
            gossip: maybeGossip ? relayGossip : doNothing,
            relay: relayTlOrStreamerComment,
          });

          return getTask({
            e,
            bl,
            cmt,
            frame,
            g,
            discordCh: e.discordCh,
            deepLTl: mustShowTl ? deepLTl : undefined,
            to: streamer?.name ?? 'Discord',
            toEmoji: getEmojiFromSteamerGroups(streamer?.groups),
          });
        })
        .filter((x) => x !== undefined) as Task[];

      return [...sendTasks, ...(mustSave ? [saveTask] : [])];
    }),
  );

  return tasks.flat();
}

function getEmojiFromSteamerGroups(groups: readonly string[] | undefined) {
  if (groups?.includes('Pixela')) return emoji.pixela;
  else if (groups?.includes('Isekai')) return emoji.isekai;
  else if (groups?.includes('Legends')) return emoji.legends;
  else if (groups?.includes('polygon')) return emoji.polygon;
  else if (groups?.includes('Nijisanji')) return emoji.niji;
  else return emoji.holo;
}

function relayCameo(
  { discordCh, to, toEmoji, cmt, deepLTl, frame, g, e }: RelayData,
  isGossip?: boolean,
): SendMessageTask {
  const cleaned = cmt.body.replaceAll('`', "'");
  const stalked = streamers.find((s) => s.ytId === cmt.id);
  const groups = stalked?.groups as string[] | undefined;

  let vemoji = getEmojiFromSteamerGroups(groups);

  const mustTl = deepLTl && g.deepl;

  const line1 = `${isGossip ? emoji.peek + ' ' : ''}${vemoji} **${
    cmt.name
  }** in ${toEmoji} **${to}**'s chat: \`${cleaned}\``;
  const line2 = mustTl ? `\n${emoji.deepl}**DeepL:** \`${deepLTl}\`` : '';
  const line3 = `\n${e.roleToNotify ? `<@&${e.roleToNotify}> ` : ''} <https://youtu.be/${
    frame.id
  }>`;
  return {
    _tag: 'SendMessageTask',
    cid: discordCh,
    content: line1 + line2 + line3,
    tlRelay: false,
    vId: frame.id,
    g: g,
  };
}

function relayGossip(data: RelayData): SendMessageTask | undefined {
  const stalked = streamers.find((s) => s.name === data.e.streamer);
  return stalked && isGossip(data.cmt, stalked, data.frame) ? relayCameo(data, true) : undefined;
}

function relayTlOrStreamerComment({
  discordCh,
  bl,
  deepLTl,
  cmt,
  g,
  frame,
}: RelayData): Task | undefined {
  const isATl = cmt.isTl || isTl(cmt.body, g);
  const mustPost =
    cmt.isOwner ||
    (isATl && !isBlacklistedOrUnwanted(cmt, g, bl)) ||
    isStreamer(cmt.id) ||
    (cmt.isMod && g.modMessages && !isBlacklistedOrUnwanted(cmt, g, bl));

  const vauthor = streamersMap.get(cmt.id);
  const groups = vauthor?.groups as string[] | undefined;

  let vemoji = getEmojiFromSteamerGroups(groups);

  const premoji = isATl ? ':speech_balloon:' : isStreamer(cmt.id) ? vemoji : ':tools:';

  const url =
    frame.status === 'live'
      ? ''
      : deepLTl
      ? `\n<https://youtu.be/${frame.id}>`
      : ` | <https://youtu.be/${frame.id}>`;

  const author = isATl ? `||${cmt.name}:||` : `**${cmt.name}:**`;
  const text = cmt.body.replaceAll('`', "''");
  const tl = deepLTl && g.deepl ? `\n${emoji.deepl}**DeepL:** \`${deepLTl}\`` : '';

  if (author === 'Nightbot') return;

  return mustPost
    ? {
        _tag: 'SendMessageTask',
        vId: frame.id,
        g,
        tlRelay: true,
        cid: discordCh,
        content: `${premoji} ${author} \`${text}\`${tl}${url}`,
        save: {
          comment: cmt,
          frame,
        },
      }
    : undefined;
}

function isGossip(cmt: ChatComment, stalked: Streamer, frame: DexFrame): boolean {
  const isOwnChannel = frame.channel.id === stalked.ytId;
  const isCollab = [stalked.twitter, stalked.ytId, stalked.name, stalked.chName].some((str) =>
    frame.description.includes(str),
  );
  const mentionsWatched =
    cmt.body
      .replace(/[,()]|'s/g, '')
      .replaceAll('-', ' ')
      .split(' ')
      .some((w) => stalked.aliases.some((a) => ciEquals(a, w))) ||
    stalked.aliases.some((a) => isJp(a) && cmt.body.includes(a));

  return !isOwnChannel && !isCollab && mentionsWatched && cmt.id !== stalked.ytId;
}

interface RelayData {
  discordCh: Snowflake;
  deepLTl?: string;
  bl: Blacklist;
  cmt: ChatComment;
  g: GuildSettings;
  frame: DexFrame;
  to: StreamerName;
  toEmoji: string;
  e: WatchFeatureSettings;
}
