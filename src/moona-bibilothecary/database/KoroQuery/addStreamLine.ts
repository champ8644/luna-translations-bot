/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { keyRowLines, RowLines } from '../../type/local';
import SQL from '../SQL';

export async function countStreamline(
  streamId: string,
  avgSongNumber?: number
) {
  const { rows } = avgSongNumber
    ? await SQL.selectCount(
        "stream_line",
        "identifier",
        '"avgSongNumber"=$1 AND "streamId"=$2',
        [avgSongNumber, streamId]
      )
    : await SQL.selectCount("stream_line", "identifier", '"streamId"=$1', [
        streamId,
      ]);
  const { count } = rows[0];
  return Number(count);
}

export default async function addStreamLine(
  lines: Array<RowLines>,
  option: { streamId: string; avgSongNumber: number }
) {
  const isDuplicate = await countStreamline(
    option.streamId,
    option.avgSongNumber
  );
  if (isDuplicate)
    return {
      command: "INSERT",
      rowCount: 0,
    };
  return SQL.insertInto("stream_line", keyRowLines, lines);
}
