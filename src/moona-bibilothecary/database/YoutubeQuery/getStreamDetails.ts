import axios from 'axios';
import { getUnixTime } from 'date-fns';

import { GOOGLE_APIS_KEY } from '../../config/secrets';

// const snippet = {
//   publishedAt: "2021-10-12T18:31:00Z",
//   channelId: "UCP0BspO_AMEe3aQqqpo89Dg",
//   title:
//     "【#MoonUtau】GUERILLA SING【Unarchive EN Song only】 2021-10-12 18:31",
//   description:
//     "I hope you enjoy tonight MoonUtau!\n===================================================\nhololive Indonesia's half-year anniversary of debut commemorative voice pack is finally here!\n\nGet it now : https://t.co/0UDcNFvVRp\n===================================================\nMoona's special birthday voice & goods can be purchased via BOOTH & GEEKJACK hololive!\n\nGet it now : \nhololive.booth.pm/items/2720578\nhttps://www.geekjack.net/moona_hoshinova\n===================================================\nLike my voice? then come to here as well! \nMoona Original Song : https://youtu.be/q4N7EhUWOAA\nMusic Playlist: https://bit.ly/3lWPo3q\n===================================================\n#MoonUtau #holoID #MoonA_Live #Moona_Hoshinova #hololive \n\nPlease follow the rules!!!\n【ID】Aturan yang perlu diingat saat streaming saat menunggu dan sedang berlangsung:\n☆Harap bersikap baik dengan sesama penonton dan berkomentarlah dengan bahasa yang sopan\n☆Dimohon untuk tidak melakukan diskusi diluar topik pada kolom komentar\n☆Dimohon tidak melakukan spam emoji/emoticon\n☆Dimohon untuk tidak mengumpat, mencela, atau berbicara dengan bahasa yang kasar\n☆Dimohon untuk tidak berdiskusi satu sama lain di waiting room \n☆Dimohon untuk tidak memberi komentar tentang Vtuber lain di waiting room / saat livestream apabila tidak dimulai lebih dulu oleh Vtuber yang sedang streaming karena bersifat kurang sopan\n\n【EN】Notice during the waiting time and the stream :\n☆Please be nice with each other and comment using polite words\n☆Please don’t have an OOT discussion in the comment \n☆Please don’t do emoji spam\n☆Please do not swear, bash, or talk with any kind of foul language\n☆Please do not do any discussion in the waiting room\n☆Please do not mention or give any comment about other Vtuber during the livestream if the topic isn't started first by the current streamer first because it would be considered impolite\n\nEnjoy the stream and let's be friend ♡\n===================================================\n【Moona Hoshinova】\n☆Twitter☆\nhttps://twitter.com/moonahoshinova\n☆Facebook Pages☆\nhttps://www.facebook.com/Moona-Hoshinova-hololive-ID-103251478005455/\n☆Instagram☆\nhttps://www.instagram.com/moonahoshinova/\n\n【Hashtag】\n☆Live : #MoonA_Live\n☆Live Game : #GeeMoon\n☆Live Mystery : #MoonaBoona\n☆Live Karaoke : #MoonUtau\n☆FanArt : #HoshinovArt\n☆Meme : #GrassMoona\n☆Fan Name: #Moonafic\n\n= Credits =\n☆BGM Stream☆ \nOpening : https://youtu.be/WqvVzRWpGzY / https://youtu.be/Le_ePMOJt20\nLive : https://youtu.be/Zcv3wFqcADw / https://youtu.be/29DH5Y5fdbo / https://youtu.be/msnXTWLa7Fs / https://youtu.be/ego8f1lvSNs\nEnding : https://youtu.be/VCjfxBdEv3M\n☆Screen☆ \nOpening : https://youtu.be/mDMa2HtP508\nOverlay : https://twitter.com/hiiragiryo\nDefault Background : Izu\nStinger : https://twitter.com/Furai_sen/status/1381246968379240450?s=20\nThumbnail by : hhttps://twitter.com/Gie__s/status/1445270414419128322?s=20\n\n-Instrumental Credit-\nMoona Hoshinova - Ai no chiisana koplo ver : https://twitter.com/jati_wiki1/status/1395021056067268611?s=20\nHiroのピアノ伴奏アレンジ\nhttps://www.youtube.com/channel/UCWX2b3xIeJHoiNOPd9nTuKA\n歌っちゃ王\nhttps://www.youtube.com/channel/UC1tk9F5-MGXEq4LWnjmrtpA\nカラオケ再現所@KEISUKEO.\nhttps://www.youtube.com/channel/UCUo8aHsNE4__8ZUxAmdhqLA\n生音風カラオケ屋\nhttps://www.youtube.com/channel/UCZ3ryrdsdqezi2q-AfRw6Rw\n\n\n\nDon't forget to follow and subscribe to my sisters!\nGenerasi 1\n【Ayunda Risu】\n• Channel: https://t.co/3AI0d4Vkbo?amp=1\n• Twitter: https://twitter.com/ayunda_risu\n\n【Moona Hoshinova】\n• Channel: https://t.co/W68ItCZBTg?amp=1\n• Twitter: https://twitter.com/moonahoshinova\n\n【Airani Iofifteen】\n• Channel: https://t.co/ATHpGQeH2b?amp=1\n• Twitter: https://twitter.com/airaniiofifteen\n\nGenerasi 2\n【Kureiji Ollie】\n• Channel: https://t.co/VJ3jCqeGR3?amp=1\n• Twitter: https://twitter.com/kureijiollie\n\n【Anya Melfissa】\n• Channel: https://t.co/Up4HqrcnSG?amp=1\n• Twitter: https://twitter.com/anyamelfissa\n\n【Pavolia Reine】\n• Channel: https://t.co/aKgza8DGQf?amp=1\n• Twitter: https://twitter.com/pavoliareine\n\n☆Official cover website\nhttp://cover-corp.com/\n☆Official Twitter hololive Indonesia\nhttps://twitter.com/hololive_Id\n☆Official Facebook hololive Indonesia\nhttps://www.facebook.com/Hololive-Indonesia-108806367277672/",
//   thumbnails: {
//     standard: {
//       url: "https://cdn.discordapp.com/attachments/889464199565172776/897557583899033650/20211012_MoonUtauGUERILLA_SINGUnarchive_EN_Song_only_LJ3EFe_hyoc.1.jpg",
//     },
//   },
//   channelTitle: "Moona Hoshinova hololive-ID",
// };

export async function getStreamDetails(streamId: string) {
  const res = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?id=${streamId}&part=snippet&key=${GOOGLE_APIS_KEY}`
  );

  if (!res.data.items[0]) return null;

  const { snippet } = res.data.items[0];
  console.log(
    "🚀 ~ file: getStreamDetails.ts ~ line 30 ~ getStreamDetails ~ snippet",
    snippet
  );

  const {
    publishedAt,
    channelId,
    title,
    description,
    thumbnails: {
      standard: { url: thumbnailUrl },
    },
    channelTitle,
  } = snippet as {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      standard: { url: string };
    };
    channelTitle: string;
  };

  const hashtagsRaw: Array<string> = [];
  description.split("\n").forEach((line) => {
    const count = (line.match(/#/g) || []).length;
    if (count >= 3) hashtagsRaw.push(line);
  });
  const hashtags: Array<string> = [];
  hashtagsRaw.forEach((hashtagsLine) => {
    hashtagsLine.split("#").forEach((word) => {
      const trim = word.trim();
      if (trim.length) {
        hashtags.push("#" + trim);
      }
    });
  });

  const isKaraoke = !!hashtags.find((x) => x === "#MoonUtau");
  const isArchive = title.toLowerCase().search("unarchive") < 0;
  const isMoona = channelId === "UCP0BspO_AMEe3aQqqpo89Dg";

  return {
    isArchive,
    isKaraoke,
    isMoona,
    publishedAt,
    channelId,
    title,
    hashtags,
    thumbnailUrl,
    channelTitle,
    timestamp: getUnixTime(new Date()),
  };
}

// getStreamDetails("CdkOabxHm7s");
