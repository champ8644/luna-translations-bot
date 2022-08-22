export const emoji: Record<Name, EmojiCode> = {
  respond: '<:LunaRespond:814173011313295370>',
  deepl: '<:deepl:835081601003290635>',
  nbsp: '<:nbsp:832910690998026260>',
  discord: '<:Discord:832902118301106216>',
  holo: '<:Hololive:832638929919803422>',
  ping: '<:WatamePing:864533105821220894>',
  tc: '<:TwitCasting:832638929608900689>',
  yt: '<:YouTube:832638929802493962>',
  peek: '<:LunaPeek:873613928867975248>',
  niji: '<:nijisanji:893782660156112986>',
  pixela: ':PixelaLogo:1011286210485956618',
  isekai: ':IsekaiLogo:1011286194312724581',
  legends: ':LegendLogo:1011286201120063489',
  polygon: ':PolygonIcon:1011290108072304771',
  ataru: ':AtaruKun:1011290096244371626',
} as const;

///////////////////////////////////////////////////////////////////////////////

type Name = string;
type EmojiCode = string;
