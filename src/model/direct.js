// file: src/model/direct.js
const DirectAPI = require("direct-js").DirectAPI;

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
    this.client = Client._startAs(user);

    this._strId = this._strId.bind(this);
    this._makeIdStr = this._makeIdStr.bind(this);
  }

  static _startAs(user) {
    const d = DirectAPI.getInstance();
    d.setOptions({
      host: 'api.direct4b.com',
      endpoint: 'wss://api.direct4b.com/albero-app-server/api',
      access_token: user.directApiToken
      // TODO: storage_path
    });
    d.listen();
    return d;
  }

  _strId(i) {
    return this.client.stringifyInt64(i);
  }

  _makeIdStr(s) {
    const i = this.client.parseInt64(s);
    return `_${i.high}_${i.low}`;
  }

  _getDomains() {
    return this.client.data.getDomains();
  }

  _getTalks() {
    return this.client.data.getTalks();
  }

  _existsTalkInDomain(talkId, domainId) {
    const ts  = this._getTalks();
    const str = this._strId;
    const res = ts
      .filter((t) => str(t.domainId) === domainId)
      .filter((t) => str(t.id) === talkId);
    return res.length > 0;
  }

  getDomains() {
    const ds  = this._getDomains();
    const str = this._strId;
    const res = ds
      .sort(byIdAsc)
      .map(d => ({id: str(d.id), name: d.domainInfo.name}));
    return res;
  }

  getTalks(domainId) {
    const ts  = this._getTalks();
    const str = this._strId;
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
      const room = this._makeIdStr(talkId);
      this.client.send({room}, text);
      return Promise.resolve('OK');
    } else {
      return Promise.reject('NotFound');
    }
  }
}