import '../datasource';
import { IUserModel } from '../entities';
import { Client } from './client';

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
    console.error(`not implemented: ${JSON.stringify(msg)}`);
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

const sendTextMessage = (msg: IpcMessage, domainId: string, talkId: string, content: string) => {
  const res = client.sendTextMessage(domainId, talkId, content);
  if (res === 'Accepted') {
    process.send({method: msg.method, result: res});
  } else {
    process.send({method: msg.method, error:  res});
  }
};