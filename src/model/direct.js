// file: src/model/direct.js
const Direct = require("direct-js").DirectAPI;

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
    default:
      console.error(`not implemented: ${msg}`);
  }
};

let direct = null;

const start = (msg, user) => {
  const d = new Direct();
  d.setOptions({
    host: 'api.direct4b.com',
    endpoint: 'wss://api.direct4b.com/albero-app-server/api',
    access_token: user.directApiToken
  });
  d.listen();
  direct = d; // NOTE: global variable
  process.send({method: msg.method, result: 'OK'});
};

const asc   = (a, b) => ((a.high - b.high) || (a.low - b.low));
const equal = (a, b) => (a.high === b.high && a.low === b.low);

const getDomains = (msg) => {
  const ds = direct.data.getDomains();
  const str = direct.stringifyInt64;
  const result = ds.sort((a, b) => asc(a.id, b.id)).map(d => ({id: str(d.id), name: d.name}));
  process.send({method: msg.method, result});
};

const getTalks = (msg, domainId) => {
  const ts = direct.data.getTalks();
  const str = direct.stringifyInt64;
  const result = ts
      .filter((t, i, a) => str(t.domainId) === domainId)
      .sort((a, b) => asc(a.id, b.id))
      .map(t => ({id: str(t.id), name: t.name, type: t.type[0], userIds: (t.userIds || []).map(i => str(i))}));
  process.send({method: msg.method, result});
};