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

const getDomains = (msg) => {
  const ds = direct.data.getDomains();
  const asc = (a, b) => ((a.high - b.high) || (a.low - b.low));
  const str = direct.stringifyInt64;
  const result = ds.sort((a, b) => asc(a.id, b.id)).map(d => ({id: str(d.id), name: d.name}));
  process.send({method: msg.method, result});
};