export type RowLines = {
  identifier: string;
  idx: number;
  songNumber?: number;
  songName?: string;
  tsText?: string;
  streamId?: string;
  fullLine: string;
  hours?: number;
  minutes?: number;
  seconds?: number;
  ts?: number;
  avgSongNumber?: number;
};

export const keyRowLines: Array<keyof RowLines> = [
  "identifier",
  "idx",
  "songNumber",
  "songName",
  "tsText",
  "streamId",
  "fullLine",
  "hours",
  "minutes",
  "seconds",
  "ts",
  "avgSongNumber",
];

export type RowMain = {
  streamId: string;
  timeText: string;
  totalLines: number;
};

export const keyRowMain: Array<keyof RowMain> = [
  "streamId",
  "timeText",
  "totalLines",
];
