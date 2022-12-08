import _ from 'lodash';

export default class LineComponent {
  songNumber: number;
  seasonNumber?: number;
  songName: string;
  timestamp?: string;
  youtubeLink?: string;
  youtubeId?: string;
  fullLine: string;
  songDisplayName: string;
  isValid: boolean;
  constructor(
    line:
      | string
      | {
          songNumber: number;
          seasonNumber?: number;
          songName: string;
          timestamp?: string;
          youtubeId?: string;
        } = "",
    youtubeIdText?: string // youtube id or youtube link
  ) {
    if (youtubeIdText) this.youtubeId = this.getYtId(youtubeIdText);
    if (_.isObject(line)) {
      // if line is an object
      this.songNumber = line.songNumber;
      this.seasonNumber = line.seasonNumber;
      this.songName = line.songName;
      this.timestamp = line.timestamp;
      this.youtubeLink = this.makeYtLink(line.timestamp, line.youtubeId);
      if (!this.youtubeId) this.youtubeId = this.getYtId() || line.youtubeId;
      this.isValid = true;
      this.fullLine = this.toRaw();
      this.songDisplayName = this.toDisplay();
    } else {
      // if line is string or undefined (default to "")
      const res = /^((\d+)(?:\((\d+)\))?\. (.*?))(?: \[(.*)\]\((.*)\))?$/.exec(
        line
      );
      this.isValid = !!res;
      const [
        fullLine,
        songDisplayName,
        lineNumberText,
        seasonNumberText,
        songName,
        timestamp,
        youtubeLink,
      ] = res || ["", "", "", "", "", ""];
      this.songNumber = Number(lineNumberText);
      if (seasonNumberText) this.seasonNumber = Number(seasonNumberText);
      this.songName = songName;
      this.timestamp = timestamp;
      if (!this.youtubeId) this.youtubeId = this.getYtId();
      this.youtubeLink = youtubeLink;
      this.fullLine = fullLine;
      this.songDisplayName = songDisplayName;
    }
  }

  makeYtLink(timestamp?: string, youtubeId?: string) {
    if ((youtubeId || this.youtubeId) && timestamp)
      return `https://youtu.be/${youtubeId || this.youtubeId}?t=${timestamp}`;
    return;
  }

  getYtId(youtubeText?: string) {
    const useYoutubeText = youtubeText || this.youtubeLink;
    if (useYoutubeText) {
      const [, youtubeId] =
        /^https:\/\/youtu\.be\/(.*?)(?:\?t=((?:\d+h)?(?:\d+m)?\d+s)?\s*)?$/.exec(
          useYoutubeText
        ) || [];
      return youtubeId;
    }
  }

  toRaw() {
    if (!this.isValid) return "";
    if (this.timestamp && this.youtubeLink)
      return `${this.toShortDisplay()} [${this.timestamp}](${
        this.youtubeLink
      })`;
    return this.toShortDisplay();
  }

  toDisplay() {
    if (!this.isValid) return "";
    if (this.timestamp) return `${this.toShortDisplay()} ${this.timestamp}`;
    return this.toShortDisplay();
  }

  toSeasonText() {
    if (!this.isValid) return "";
    if (this.seasonNumber && this.seasonNumber > 1)
      return `(${this.seasonNumber})`;
    return "";
  }

  toShortDisplay() {
    if (!this.isValid) return "";
    return `${this.songNumber}${this.toSeasonText()}. ${this.songName}`;
  }

  replace({ songName, timestamp }: { songName?: string; timestamp?: string }) {
    if (!timestamp && !songName) return new LineComponent(this);
    let youtubeLink;
    if (timestamp) youtubeLink = this.makeYtLink(timestamp, this.getYtId());

    const newLine = new LineComponent({
      ...this,
      songName,
      timestamp,
      youtubeLink,
    });
    return newLine;
  }

  replaceSongName(songName: string, withLink = true) {
    if (!this.isValid) return "";
    if (this.timestamp && this.youtubeLink)
      return (
        `${this.songNumber}${this.toSeasonText()}. ${songName}` +
        (withLink ? ` [${this.timestamp}](${this.youtubeLink})` : "")
      );
    return `${this.songNumber}${this.toSeasonText()}. ${songName}`;
  }
}
