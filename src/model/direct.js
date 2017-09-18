// file: src/model/direct.js
const fs = require('fs');
const DirectAPI = require("direct-js").DirectAPI;
const webhook = require('./webhook');

process.on('message', (msg) => {
  dispatch(msg);
});

const dispatch = (msg) => {
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

let client = null;

const start = (msg, user) => {
  client = new Client(user);
  client.start();
  process.send({method: msg.method, result: 'OK'});
};

const getDomains = (msg) => {
  const result = client.getDomains();
  process.send({method: msg.method, result});
};

const getTalks = (msg, domainId) => {
  const result = client.getTalks(domainId);
  process.send({method: msg.method, result});
};

const sendTextMessage = (msg, domainId, talkId, content) => {
  client.sendTextMessage(domainId, talkId, content.text || content)
    .then(() => process.send({method: msg.method, result: 'OK'}))
    .catch(e => process.send({method: msg.method, error: e}));
};

// ----

const idAsc   = (a, b) => ((a.high - b.high) || (a.low - b.low));
const byIdAsc = (a, b) => idAsc(a.id, b.id)

class Client {
  constructor(user) {
    this.user = user;
    this.client = Client._create(user);

    this._int64ToDecimalStr = this._int64ToDecimalStr.bind(this);
    this._decimalStrToHLStr = this._decimalStrToHLStr.bind(this);
    this._hlStrToDecimalStr = this._hlStrToDecimalStr.bind(this);
    this._handleTextMessage = this._handleTextMessage.bind(this);
  }

  static _create(user) {
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

  _handleTextMessage(talk, author, msg) {
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

  _int64ToDecimalStr(i) { // :: self => Int64 -> String
    return this.client.stringifyInt64(i); // signed decimal string representation of i
  }

  _decimalStrToHLStr(s) { // :: self => String -> String
    const i = this.client.parseInt64(s); // input decimal string
    return `_${i.high}_${i.low}`;
  }

  // FIXME: doesn't work
  _hlStrToDecimalStr(s) { // :: self => String -> String
    const res = /^_(-?\d*)_(-?\d*)$/.exec(s);
    return this._int64ToDecimalStr({high: Number(res[1]), low: Number(res[2])});
  }

  _getDomains() {
    return this.client.data.getDomains();
  }

  _getTalks() {
    return this.client.data.getTalks();
  }

  _existsTalkInDomain(talkId, domainId) {
    const ts  = this._getTalks();
    const str = this._int64ToDecimalStr;
    const res = ts
      .filter((t) => str(t.domainId) === domainId)
      .filter((t) => str(t.id) === talkId);
    return res.length > 0;
  }

  getDomains() {
    const ds  = this._getDomains();
    const str = this._int64ToDecimalStr;
    const res = ds
      .sort(byIdAsc)
      .map(d => ({id: str(d.id), name: d.domainInfo.name}));
    return res;
  }

  getTalks(domainId) {
    const ts  = this._getTalks();
    const str = this._int64ToDecimalStr;
    const res = ts
      .filter((t) => str(t.domainId) === domainId)
      .sort(byIdAsc)
      .map(t => ({
        id: str(t.id),
        name: t.name,
        type: t.type[0],
        userIds: (t.userIds || []).map(i => str(i))
      }));
    return res;
  }

  sendTextMessage(domainId, talkId, text) { // :: self => String -> String -> String -> Promise ()
    if (this._existsTalkInDomain(talkId, domainId)) {
      const room = this._decimalStrToHLStr(talkId);
      this.client.send({room}, text);
      return Promise.resolve('OK');
    } else {
      return Promise.reject('NotFound');
    }
  }
}