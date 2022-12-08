/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import SQL from '../SQL';

async function checkStreamMainDuplicate(streamId: string) {
  const { rows } = await SQL.query(
    'SELECT COUNT("streamId") FROM stream_main WHERE  "streamId"=$1',
    [streamId]
  );
  const { count } = rows[0];
  return !!Number(count);
}

export default async function addStreamMain(payload: {
  streamId: string;
  timeText: string;
  totalLines: number;
}) {
  return SQL.insertIntoUpdate("stream_main", payload, "streamId");
}
