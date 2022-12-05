export const emoji: Record<Name, EmojiCode> = {
  respond: '<:LunaRespond:814173011313295370>',
  deepl: '<:deepl:835081601003290635>',
  nbsp: '<:nbsp:832910690998026260>',
  discord: '<:Discord:832902118301106216>',
  holo: '<:Hololive:832638929919803422>',
  ping: '<:WatamePing:864533105821220894>',
  tc: '<:TwitCasting:832638929608900689>',
  yt: '<:YouTube:832638929802493962>',
  peek: ':eyes:',
  niji: '<:nijisanji:893782660156112986>',
  pixela: '<:PixelaLogo:1011286010077925416>',
  isekai: '<:IsekaiLogo:1011286014100263002>',
  legends: '<:LegendLogo:1011286012225405050>',
  polygon: '<:PolygonIcon:1011289934524600441>',
  ataru: '<:AtaruKun:1011289931466948628>',
} as const;

///////////////////////////////////////////////////////////////////////////////

type Name = string;
type EmojiCode = string;
