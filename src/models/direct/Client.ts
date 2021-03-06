import * as fs from "fs";
import * as webhook from "../webhook";
import { IUser } from "../entities";
import { Domain, Talk } from "./Types";
import * as bigInt from 'big-integer';

const DirectAPI = require("direct-js").DirectAPI;

const createDirectAPI = (user: IUser) => {
  const storagePath = `/data/storage.local/${user.directUserId}`;
  fs.existsSync(storagePath) || fs.mkdirSync(storagePath, 0o755);

  const d = DirectAPI.getInstance();
  d.setOptions({
    host: "api.direct4b.com",
    endpoint: "wss://api.direct4b.com/albero-app-server/api",
    access_token: user.directApiToken,
    storage_path: storagePath
  });
  return d;
};

type HaxeInt64 = { high: number, low: number };

const idAsc   = (a: HaxeInt64, b: HaxeInt64) => ((a.high - b.high) || (a.low - b.low));
const byIdAsc = (a: { id: HaxeInt64 }, b: { id: HaxeInt64 }) => idAsc(a.id, b.id);

export class Client {
  private readonly directjs: any;

  constructor(private readonly user: IUser) {
    this.directjs = createDirectAPI(user);
    this._int64ToDecimalStr = this._int64ToDecimalStr.bind(this);
    this._decimalStrToHLStr = this._decimalStrToHLStr.bind(this);
    this._hlStrToDecimalStr = this._hlStrToDecimalStr.bind(this);
    this._handleTextMessage = this._handleTextMessage.bind(this);
  }

  start() {
    this.directjs.on("TextMessage", this._handleTextMessage);
    this.directjs.listen();
  }

  _handleTextMessage(talk: any, author: any, msg: any) { // TODO
    const user = this.user;

    const domainId = this._hlStrToDecimalStr(talk.rooms[talk.room].domainId);
    const talkId   = this._hlStrToDecimalStr(talk.room);
    const authorId = this._hlStrToDecimalStr(author.id);
    const text     = msg.content;
    const event    = new webhook.DirectEvent(domainId, talkId, authorId, text);

    webhook.findByEvent(user, event)
      .then(hooks => hooks.map(hook => new webhook.Outgoing(hook.config)))
      .then(hooks => hooks.map(hook => hook.execute(event)))
      .then(ps => Promise.all(ps))
      .then(res => console.log(`${res.length} webhook(s) executed`)) // FIXME
      .catch(console.error); // FIXME: save as event history
  }

  private _int64ToDecimalStr(i: HaxeInt64): string {
    return this.directjs.stringifyInt64(i); // signed decimal string representation of i
  }

  private _decimalStrToHLStr(s: string): string {
    const i = this.directjs.parseInt64(s); // input decimal string
    return `_${i.high}_${i.low}`;
  }

  private _hlStrToDecimalStr(s: string): string {
    const res = /^_(-?\d*)_(-?\d*)$/.exec(s);
    if (!res) {
      return "";
    }
    const h = bigInt(res[1]).and(bigInt("ffffffff", 16));
    const l = bigInt(res[2]).and(bigInt("ffffffff", 16));
    return h.shiftLeft(32).or(l).toString();
  }

  private _getDomains(): any[] { // TODO
    return this.directjs.data.getDomains();
  }

  private _getTalks(): any[] { // TODO
    return this.directjs.data.getTalks();
  }

  private _existsTalkInDomain(talkId: string, domainId: string): boolean {
    const ts: any  = this._getTalks();
    const str = this._int64ToDecimalStr;
    const res = ts
      .filter((t: any) => str(t.domainId) === domainId)
      .filter((t: any) => str(t.id) === talkId);
    return res.length > 0;
  }

  // --- API

  getDomains(): Domain[] {
    const ds  = this._getDomains();
    const str = this._int64ToDecimalStr;
    const res = ds
      .sort(byIdAsc)
      .map((d: any) => (new Domain(str(d.id), d.domainInfo.name)));
    return res;
  }

  getTalks(domainId: string): Talk[] {
    const ts  = this._getTalks();
    const str = this._int64ToDecimalStr;
    const res = ts
      .filter((t: any) => str(t.domainId) === domainId)
      .sort(byIdAsc)
      .map((t: any) => (new Talk(
        str(t.id),
        t.name,
        t.type[0],
        (t.userIds || []).map((i: any) => str(i))
      )));
    return res;
  }

  sendTextMessage(domainId: string, talkId: string, text: string): string { // FIXME
    if (this._existsTalkInDomain(talkId, domainId)) {
      const room = this._decimalStrToHLStr(talkId);
      this.directjs.send({room}, text);
      return "Accepted";
    } else {
      return "NotFound";
    }
  }
}