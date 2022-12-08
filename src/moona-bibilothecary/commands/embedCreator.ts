import Discord from 'discord.js';

type EmbedCreatorProps = {
  color: Discord.ColorResolvable;
  thumbnail?: string;
  title: string;
  description: string;
  url: string;
  fields: Discord.EmbedFieldData[];
};

export function embedCreator(props: EmbedCreatorProps) {
  const { color, thumbnail, title, description, url, fields } = props;
  const embed = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setURL(url)
    .setFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  return embed;
}

type EmbedDeletorProps = {
  title: string | null;
  thumbnail?: string;
  color: number | null;
  url: string;
  originalLine: string;
  isShift?: boolean;
};

export function embedDeletor(props: EmbedDeletorProps) {
  const {
    title,
    thumbnail,
    color,
    url,
    originalLine = "\u200b",
    isShift = false,
  } = props;
  return embedCreator({
    title: title || "",
    description: "Deletor by Moona-Librarian",
    thumbnail,
    color: color || 0,
    url,
    fields: [
      { name: "Original", value: originalLine, inline: true },
      { name: "Shifting", value: "" + (isShift ? true : false), inline: true },
    ],
  });
}

type EmbedEditorProps = {
  title: string | null;
  thumbnail?: string;
  color: number | null;
  url: string;
  originalLine: string;
  editedLine: string;
  originalTimestamp?: string;
  editedTimestamp?: string;
};

export function embedEditor(props: EmbedEditorProps) {
  const {
    title,
    thumbnail,
    color,
    url,
    originalLine = "\u200b",
    originalTimestamp,
    editedLine = "\u200b",
    editedTimestamp,
  } = props;
  let fields: Discord.EmbedFieldData[];
  if (!editedTimestamp)
    fields = [
      { name: "Original", value: originalLine, inline: false },
      { name: "Edited", value: editedLine, inline: false },
    ];
  else
    fields = [
      { name: "Original", value: originalLine, inline: true },
      {
        name: "Timestamp",
        value: originalTimestamp || "\u200b",
        inline: true,
      },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "Edited", value: editedLine, inline: true },
      { name: "Timestamp", value: editedTimestamp || "\u200b", inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
    ];
  return embedCreator({
    title: title || "",
    description: "Editor by Moona-Librarian",
    thumbnail,
    color: color || 0,
    url,
    fields,
  });
}

type EmbedAdderProps = {
  title: string | null;
  thumbnail?: string;
  color: number | null;
  url: string;
  addLine: string;
  addTimestamp?: string;
};

export function embedAdder(props: EmbedAdderProps) {
  const { title, thumbnail, color, url, addLine, addTimestamp } = props;
  let fields: Discord.EmbedFieldData[];
  if (!addTimestamp) fields = [{ name: "add", value: addLine, inline: false }];
  else
    fields = [
      { name: "add", value: addLine, inline: true },
      { name: "Timestamp", value: addTimestamp || "\u200b", inline: true },
    ];
  return embedCreator({
    title: title || "",
    description: "Adder by Moona-Librarian",
    thumbnail,
    color: color || 0,
    url,
    fields,
  });
}
