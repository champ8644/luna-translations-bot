import fetch from './fetch';

class MoonaClock {
  previousState: boolean;
  constructor() {
    this.previousState = true;
    this.fetch();
  }

  async fetch() {
    const res = await fetch(
      "https://www.youtube.com/channel/UCP0BspO_AMEe3aQqqpo89Dg/live"
    );
    const res2 = await fetch(
      "https://www.youtube.com/channel/UCHsx4Hqa-1ORjQTh9TYDhww/live"
    );
    console.log("res", res.redirected);
    console.log("res2", res2.redirected);
    // console.log(
    //   "🚀 ~ file: MoonaClock.ts ~ line 13 ~ MoonaClock ~ fetch ~ res",
    //   { payload, payload2 }
    // );
    // writeFileSync("src/res.json", JSON.stringify(payload, null, 2));
    // writeFileSync("src/res2.json", JSON.stringify(payload2, null, 2));
  }
}

const moonaClock = new MoonaClock();

export default moonaClock;
