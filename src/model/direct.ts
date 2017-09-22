// file: src/model/direct.js
import * as fs from 'fs';
import * as webhook from './webhook';
import { IUserModel } from './db';

const DirectAPI = require("direct-js").DirectAPI;

process.on('message', (msg) => {
  dispatch(msg);
});

interface IpcMessage { // FIXME
  method: string;
  user?: any;
  domainId?: string;
  talkId?: string;
  content?: any;
}

const dispatch = (msg: IpcMessage) => {
  switch (msg.method) {
  case 'start':
    start(msg, msg.user);
    break;
  case 'getDomains':
    getDomains(msg);
    break;
  case 'getTalks':
    getTalks(msg, msg.domainId);
    break;
  case 'sendTextMessage':
    sendTextMessage(msg, msg.domainId, msg.talkId, msg.content);
    break;
  default:
    console.error(`not implemented: ${msg}`);
  }
};

let client: Client = null;

const start = (msg: IpcMessage, user: IUserModel) => {
  client = new Client(user);
  client.start();
  process.send({method: msg.method, result: 'OK'});
};

const getDomains = (msg: IpcMessage) => {
  const result = client.getDomains();
  process.send({method: msg.method, result});
};

const getTalks = (msg: IpcMessage, domainId: string) => {
  const result = client.getTalks(domainId);
  process.send({method: msg.method, result});
};

const sendTextMessage = (msg: IpcMessage, domainId: string, talkId: string, content: any) => {
  client.sendTextMessage(domainId, talkId, content.text || content)
    .then(() => process.send({method: msg.method, result: 'OK'}))
    .catch(e => process.send({method: msg.method, error: e}));
};

// ----

interface HaxeInt64 {
  high: number;
  low: number;
}
const idAsc   = (a: HaxeInt64, b: HaxeInt64) => ((a.high - b.high) || (a.low - b.low));
const byIdAsc = (a: { id: HaxeInt64 }, b: { id: HaxeInt64 }) => idAsc(a.id, b.id)

class Client {
  user: IUserModel;
  client: any; // TODO

  constructor(user: IUserModel) {
    this.user = user;
    this.client = Client._create(user);

    this._int64ToDecimalStr = this._int64ToDecimalStr.bind(this);
    this._decimalStrToHLStr = this._decimalStrToHLStr.bind(this);
    this._hlStrToDecimalStr = this._hlStrToDecimalStr.bind(this);
    this._handleTextMessage = this._handleTextMessage.bind(this);
  }

  static _create(user: IUserModel) {
    const storagePath = `/data/storage.local/${user._id}`;
    fs.existsSync(storagePath) || fs.mkdirSync(storagePath, 0o755);

    const d = DirectAPI.getInstance();
    d.setOptions({
      host: 'api.direct4b.com',
      endpoint: 'wss://api.direct4b.com/albero-app-server/api',
      access_token: user.directApiToken,
      storage_path: storagePath
    });
    return d;
  }

  start() {
    this.client.on('TextMessage', this._handleTextMessage);
    this.client.listen();
  }

  _handleTextMessage(talk: any, author: any, msg: any) { // TODO
    const userId = this.user._id;

    const domainId = talk.rooms[talk.room].domainId;
    const talkId   = talk.room;
    const authorId = author.id;
    const text     = msg.content;
    const event    = new webhook.DirectEvent(domainId, talkId, authorId, text, this._decimalStrToHLStr);

    webhook.findByEvent(userId, event)
      .then(hooks => hooks.map(hook => hook.execute()))
      .then(ps => Promise.all(ps))
      .then(res => console.log(`${res.length} webhook(s) executed`)) // FIXME
      .catch(console.error); // FIXME: save as event history
  }

  _int64ToDecimalStr(i: HaxeInt64): string {
    return this.client.stringifyInt64(i); // signed decimal string representation of i
  }

  _decimalStrToHLStr(s: string): string {
    const i = this.client.parseInt64(s); // input decimal string
    return `_${i.high}_${i.low}`;
  }

  // FIXME: doesn't work
  _hlStrToDecimalStr(s: string): string {
    const res = /^_(-?\d*)_(-?\d*)$/.exec(s);
    return this._int64ToDecimalStr({high: Number(res[1]), low: Number(res[2])});
  }

  _getDomains() { // TODO
    return this.client.data.getDomains();
  }

  _getTalks() { // TODO
    return this.client.data.getTalks();
  }

  _existsTalkInDomain(talkId: string, domainId: string) {
    const ts: any  = this._getTalks();
    const str = this._int64ToDecimalStr;
    const res = ts
      .filter((t: any) => str(t.domainId) === domainId)
      .filter((t: any) => str(t.id) === talkId);
    return res.length > 0;
  }

  getDomains() {
    const ds  = this._getDomains();
    const str = this._int64ToDecimalStr;
    const res = ds
      .sort(byIdAsc)
      .map((d: any) => ({id: str(d.id), name: d.domainInfo.name}));
    return res;
  }

  getTalks(domainId: string) {
    const ts  = this._getTalks();
    const str = this._int64ToDecimalStr;
    const res = ts
      .filter((t: any) => str(t.domainId) === domainId)
      .sort(byIdAsc)
      .map((t: any) => ({
        id: str(t.id),
        name: t.name,
        type: t.type[0],
        userIds: (t.userIds || []).map((i: any) => str(i))
      }));
    return res;
  }

  sendTextMessage(domainId: string, talkId: string, text: string): Promise<string> {
    if (this._existsTalkInDomain(talkId, domainId)) {
      const room = this._decimalStrToHLStr(talkId);
      this.client.send({room}, text);
      return Promise.resolve('OK');
    } else {
      return Promise.reject('NotFound');
    }
  }
}