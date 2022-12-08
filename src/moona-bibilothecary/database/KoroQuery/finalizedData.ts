import { RowLines } from '../../type/local';

export default async function finalizedData(
  streamId: string,
  rows: Array<RowLines>
) {
  const songNumberTrack: Record<string, number> = {};

  const final = rows
    .map(({ songNumber, songName, tsText }) => {
      if (!songNumber) return;
      if (!songNumberTrack[songNumber]) songNumberTrack[songNumber] = 1;
      else songNumberTrack[songNumber]++;
      const songNumberTrackText =
        songNumberTrack[songNumber] > 1
          ? `(${songNumberTrack[songNumber]})`
          : "";
      return `${songNumber}${songNumberTrackText}. ${songName} [${tsText}](https://youtu.be/${streamId}?t=${tsText})`;
    })
    .filter((x) => x !== undefined) as Array<string>;

  return final;
}
