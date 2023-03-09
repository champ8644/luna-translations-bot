import { format } from 'date-fns';
import Discord from 'discord.js';
import _ from 'lodash';

const colorType = {
  notmoona: '#ff0000',
  archive: '#b29ede',
  unarchive: '#e4c420',
  undefined: '#888888',
} as const;

type Colors = typeof colorType[keyof typeof colorType];

type BuildEmbedPostProps = {
  title: string;
  streamLink: string;
  isArchive: boolean;
  isKaraoke: boolean;
  isMoona: boolean;
  imageLink: string;
  description: string | Array<string>;
  publishedDate: Date;
};

const EMBED_LIMIT = 4000;

function sumArr(descriptions: Array<string>): number {
  return Math.max(
    descriptions.reduce((state, next) => state + next.length + 1, -1),
    0,
  );
}

export default function buildEmbedPost(props: BuildEmbedPostProps) {
  const {
    title,
    streamLink,
    isArchive,
    isKaraoke,
    isMoona,
    imageLink,
    description,
    publishedDate,
  } = props;

  if (!title) return;

  const archiveText = isArchive ? '✅ Archived' : '⛔ Unarchived';
  const karaokeText = isKaraoke ? '🎤 Karaoke' : '🔴 Streaming';
  let titleText = 'Stream';
  if (!isMoona) titleText = 'Collab Stream';
  else if (isKaraoke) titleText = 'Karaoke Stream';
  let color: Colors = colorType.undefined;
  if (!isMoona) color = colorType.notmoona;
  else if (isArchive) color = colorType.archive;
  else color = colorType.unarchive;

  if (!_.isArray(description)) {
    return [
      new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setURL(streamLink)
        .setTimestamp(publishedDate)
        .setImage(imageLink)
        .setAuthor(
          (isArchive ? '[Archive]' : '[Unarchive]') +
            ` ${titleText} ${format(publishedDate, 'dd/MM/yy')}`,
        )
        .setDescription(description)
        .setFooter(`${karaokeText} ${archiveText} 🔮 Public`),
    ];
  }

  const splitDescriptions: Array<string> = [];
  const baselineLeft =
    EMBED_LIMIT -
    new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(title)
      .setURL(streamLink)
      .setTimestamp(publishedDate)
      .setImage(imageLink)
      .setAuthor(
        (isArchive ? '[Archive]' : '[Unarchive]') +
          ` ${titleText} ${format(publishedDate, 'dd/MM/yy')} (999)`,
      )
      .setFooter(`${karaokeText} ${archiveText} 🔮 Public`).length;
  let countLeft = baselineLeft;
  let descriptionBuilder: Array<string> = [];

  description.forEach((eachDescription) => {
    const currentLineLength = eachDescription.length + 1;
    if (countLeft - currentLineLength < 0) {
      splitDescriptions.push(descriptionBuilder.join('\n'));
      countLeft = baselineLeft;
      descriptionBuilder = [];
    }
    countLeft -= currentLineLength;
    descriptionBuilder.push(eachDescription);
  });
  if (descriptionBuilder.length) {
    splitDescriptions.push(descriptionBuilder.join('\n'));
    descriptionBuilder = [];
  }

  return splitDescriptions.map((eachSplitDescription, idx) => {
    const idxTxt = splitDescriptions.length > 1 ? ` (${idx + 1})` : '';
    if (idx + 1 === splitDescriptions.length)
      return new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setURL(streamLink)
        .setTimestamp(publishedDate)
        .setImage(imageLink)
        .setAuthor(
          (isArchive ? '[Archive]' : '[Unarchive]') +
            ` ${titleText} ${format(publishedDate, 'dd/MM/yy')}${idxTxt}`,
        )
        .setDescription(eachSplitDescription)
        .setFooter(`${karaokeText} ${archiveText} 🔮 Public`);
    return new Discord.MessageEmbed()
      .setColor(color)
      .setTitle(title)
      .setURL(streamLink)
      .setTimestamp(publishedDate)
      .setAuthor(
        (isArchive ? '[Archive]' : '[Unarchive]') +
          ` ${titleText} ${format(publishedDate, 'dd/MM/yy')}${idxTxt}`,
      )
      .setDescription(eachSplitDescription)
      .setFooter(`${karaokeText} ${archiveText} 🔮 Public`);
  });
}
