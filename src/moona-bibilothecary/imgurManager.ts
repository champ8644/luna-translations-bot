import axios from 'axios';
import { addMilliseconds, isBefore } from 'date-fns';
import { Message, MessageEmbed } from 'discord.js';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import config from './config/botConfig';
import korotaggerInfo from './config/korotaggerInfo';
import { IMGUR_CLIENT_ID, IMGUR_CLIENT_SECRET } from './config/secrets';
import SQL from './database/SQL';
import errorHandler from './errorHandler';
import imgurNpm from './imgurNpm';

export default class ImgurManager {
  clientId = IMGUR_CLIENT_ID;
  clientSecret = IMGUR_CLIENT_SECRET;
  accessToken = "";
  refreshToken = "";
  OauthState = "";
  ready = false;

  async init() {
    await this.getAccessToken();
    this.setNewToken();
    if (this.accessToken) console.log("Imgur instantiated");
    else console.error("Imgur error!");
    this.ready = true;
  }

  setNewToken() {
    imgurNpm.setClientId(this.clientId);
    imgurNpm.setAccessToken(this.accessToken);
  }

  async getOauthLink(message: Message) {
    try {
      const link = message.content;
      console.log(link);
      let [url, queryText] = link.split("?");
      if (!url && !queryText) throw "queryText is badly formatted";
      if (!queryText) queryText = url;
      const [stateUuid, payload] = queryText.split("#");
      if (!payload) throw "payload from url is badly formatted";
      const res = payload.split("&");
      const stateUrl = [stateUuid, ...res].reduce((state, next) => {
        const [key, val] = next.split("=");
        if (key && val) state[key] = val;
        return state;
      }, {} as Record<string, string>);
      if (stateUrl.state !== this.OauthState)
        throw `state is not corrected
      expected: ${this.OauthState}
      recieved: ${stateUrl.state}`;
      if (_.values(stateUrl).length < 7)
        throw "payload from url is not complete";
      if (stateUrl.account_username !== "champ8644") throw "Username incorrect";
      return stateUrl;
    } catch (err: unknown) {
      errorHandler.messageError(message, err as string, { codeBlock: true });
      return false;
    }
  }

  askOauth() {
    return new Promise(async (resolve, reject) => {
      const channelLog = await korotaggerInfo.getChannelLog();
      if (!channelLog) return console.error("There is no channel for logging");
      this.OauthState = uuid();
      const embeds = [
        new MessageEmbed()
          .setTitle("Imgur user expired! Please re-authenticate")
          .setDescription(
            `Click [here](https://api.imgur.com/oauth2/authorize?client_id=${IMGUR_CLIENT_ID}&response_type=token&state=${this.OauthState}) for re-authentication...`
          )
          .setURL(
            `https://api.imgur.com/oauth2/authorize?client_id=${IMGUR_CLIENT_ID}&response_type=token&state=${this.OauthState}`
          )
          .setImage("https://s.imgur.com/images/logo-1200-630.jpg?2"),
      ];
      const messageReply = await channelLog.send({ embeds });

      const messageCollector = messageReply.channel.createMessageCollector({
        filter: (messageAnswerReply) =>
          messageAnswerReply.reference?.messageId === messageReply.id,
        time: config.timeLimit,
      });

      messageCollector.on("collect", async (messageAnswerReply) => {
        const resultPayload = await this.getOauthLink(messageAnswerReply);
        if (resultPayload) {
          messageCollector.stop("accept");
          if (messageAnswerReply.deletable) messageAnswerReply.delete();
          if (messageReply.deletable) messageReply.delete();
          channelLog.send("```Complete Logging in Imgur!```");
          resolve(resultPayload);
          return;
        }
      });
    });
  }

  async getAccessToken() {
    const res = await SQL.query(`SELECT * FROM imgur_manager`);
    let payload;
    if (!res.rowCount) payload = await this.askOauth();
    else {
      const { rows } = res;
      payload = rows[0];
    }
    const { refresh_token, access_token, expires_in } = payload;
    this.refreshToken = refresh_token;
    this.accessToken = access_token;
    this.refresh();
    if (isBefore(expires_in, new Date())) return this.refresh();
  }

  async setTokenToSQL({
    refresh_token,
    access_token,
    expires_in,
  }: {
    refresh_token: string;
    access_token: string;
    expires_in: Date;
  }) {
    await SQL.query("DELETE FROM imgur_manager");
    return SQL.query(
      `INSERT INTO imgur_manager (refresh_token, access_token, expires_in) VALUES ($1,$2,$3)`,
      [refresh_token, access_token, expires_in]
    );
  }

  async refresh() {
    try {
      const { data } = await axios.post("https://api.imgur.com/oauth2/token", {
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      });
      this.refreshToken = data.refresh_token;
      this.accessToken = data.access_token;
      const expires = addMilliseconds(new Date(), data.expires_in);
      return await this.setTokenToSQL({
        refresh_token: this.refreshToken,
        access_token: this.accessToken,
        expires_in: expires,
      });
    } catch (err: any) {
      console.error(err.toJSON());
      const res = await SQL.query(`SELECT * FROM imgur_manager`);
      const { rows } = res;
      console.log("refresh err", {
        rows,
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
      });
    }
  }

  async uploadFile(payload: string, albumId?: string) {
    try {
      const res = await imgurNpm.uploadFile(payload, albumId);
      return res;
    } catch (err) {
      await this.refresh();
      const res = await imgurNpm.uploadFile(payload, albumId);
      return res;
    }
  }

  async uploadUrl(payload: string, albumId?: string) {
    try {
      const res = await imgurNpm.uploadUrl(payload, albumId);
      return res;
    } catch (err) {
      await this.refresh();
      const res = await imgurNpm.uploadUrl(payload, albumId);
      return res;
    }
  }
}
