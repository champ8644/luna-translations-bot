import SQL from '../SQL';

export default async function finalizedData(streamId: string) {
  const { rows } = await SQL.query(
    'SELECT * FROM stream_line WHERE "streamId"=$1 AND "songNumber" IS NOT NULL',
    [streamId]
  );

  rows.sort((a, b) => a.avgSongNumber - b.avgSongNumber || a.idx - b.idx);

  const songNumberTrack: Record<string, number> = {};

  const final = rows.map(({ songNumber, songName, tsText }) => {
    if (!songNumberTrack[songNumber]) songNumberTrack[songNumber] = 1;
    else songNumberTrack[songNumber]++;
    const songNumberTrackText =
      songNumberTrack[songNumber] > 1 ? `(${songNumberTrack[songNumber]})` : "";
    return `${songNumber}${songNumberTrackText}. ${songName} [${tsText}](https://youtu.be/${streamId}?t=${tsText})`;
  });

  return final;
}
