import SQL from '../SQL';

export type StreamDetails = {
  isReady: boolean;
  streamId: string;
  timeText?: string;
  totalLines?: number;
  isDone?: boolean;
  isArchive?: boolean;
  isKaraoke?: boolean;
  isMoona?: boolean;
  publishedAt?: string;
  channelId?: string;
  title?: string;
  hashtags?: string[];
  thumbnailUrl?: string;
  channelTitle?: string;
  timestamp?: number;
};

export async function getDataReadiness(
  streamId: string
): Promise<StreamDetails> {
  const { rows } = await SQL.query(
    'SELECT * from stream_main WHERE "streamId"=$1',
    [streamId]
  );
  console.log(
    "🚀 ~ file: checkDataReadiness.ts ~ line 28 ~ rows.length",
    rows.length
  );
  if (!rows.length) return { isReady: false, streamId };
  const streamDetails = rows[0];
  const { isDone } = streamDetails;
  console.log("🚀 ~ file: checkDataReadiness.ts ~ line 35 ~ isDone", isDone);
  if (isDone) return { isReady: false, streamId };
  return { ...streamDetails, isReady: true };
}

export default async function checkDataReadiness(
  streamId: string,
  _totalLines?: number
): Promise<StreamDetails> {
  console.log(
    "🚀 ~ file: checkDataReadiness.ts ~ line 26 ~ totalLines",
    _totalLines
  );

  const { rows } = await SQL.query(
    'SELECT * from stream_main WHERE "streamId"=$1',
    [streamId]
  );
  if (!rows.length) return { isReady: false, streamId };
  const streamDetails = rows[0];
  console.log("🚀 ~ file: checkDataReadiness.ts ~ line 32 ~ rows", rows);
  const { totalLines: SQLTotalLines, isDone } = streamDetails;
  if (isDone) return { isReady: false, streamId };
  const totalLines = _totalLines || Number(SQLTotalLines as string);
  console.log("🚀 ~ file: checkDataReadiness.ts ~ line 38 ~ totalLines", {
    _totalLines,
    a: Number(SQLTotalLines as string),
    totalLines,
  });

  const countStreamLines = await SQL.selectCount(
    "stream_line",
    "idx",
    '"streamId"=$1',
    [streamId]
  );
  const currentLines = Number(countStreamLines.rows[0].count);

  return { ...streamDetails, isReady: currentLines >= totalLines };
}
