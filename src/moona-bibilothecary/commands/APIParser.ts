import Discord from 'discord.js';

type EmbedCreatorProps = {
  color?: number;
  thumbnail?: {
    url?: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  title: string;
  description: string;
  url: string;
  fields: Discord.EmbedFieldData[];
  footers: Array<string>;
};

export function embedCreator(props: EmbedCreatorProps) {
  const { color, thumbnail, title, description, url, fields, footers } = props;
  const embed = {
    title,
    description,
    url,
    color,
    footer: { text: footers.join(" ") },
    thumbnail,
    fields,
  };
  return embed;
  // const embed = new Discord.MessageEmbed()
  //   .setColor(color)
  //   .setTitle(title)
  //   .setDescription(description)
  //   .setURL(url)
  //   .setFields(fields)
  //   .setFooter(footers.join(" "));
  // if (thumbnail) embed.setThumbnail(thumbnail);
  // return embed;
}

type EmbedEditorProps = {
  title: string | null;
  thumbnail: Discord.MessageEmbedImage | null;
  color: number | null;
  url: string;
  deleteList: Array<string>;
  originalLine: string;
  editedLine: string;
};

export function embedEditor(props: EmbedEditorProps) {
  const { title, thumbnail, color, url, deleteList, originalLine, editedLine } =
    props;
  return embedCreator({
    title: title || "",
    description: "Moona-Librarian Editor",
    ...(thumbnail && {
      thumbnail: {
        url: thumbnail.url,
        proxy_url: thumbnail.proxyURL,
        height: thumbnail.height,
        width: thumbnail.width,
      },
    }),
    color: color || 0,
    url,
    fields: [
      { name: "Original", value: originalLine, inline: false },
      { name: "Edited", value: editedLine, inline: false },
    ],
    footers: deleteList,
  });
}
