import "../datasource";
import { IUser } from "../entities";
import { Client } from "./client";
import * as t from "./types";

process.on("message", (msg) => {
  dispatch(msg);
});

const dispatch = (msg: t.IpcMessage) => {
  switch (msg.method) {
  case "start":
    start(msg);
    break;
  case "getDomains":
    getDomains(msg);
    break;
  case "getTalks":
    getTalks(msg);
    break;
  case "sendTextMessage":
    sendTextMessage(msg);
    break;
  default:
    console.error(`not implemented: ${JSON.stringify(msg)}`);
  }
};

let client: Client | null = null;

const start = (msg: t.IStart) => {
  client = new Client(msg.user);
  client.start();
  process.send!({method: msg.method, result: "OK"});
};

const getDomains = (msg: t.IGetDomains) => {
  const result = client!.getDomains();
  process.send!({method: msg.method, result});
};

const getTalks = (msg: t.IGetTalks) => {
  const result = client!.getTalks(msg.domainId);
  process.send!({method: msg.method, result});
};

const sendTextMessage = (msg: t.ISendTextMessage) => {
  const res = client!.sendTextMessage(msg.domainId, msg.talkId, msg.content);
  if (res === "Accepted") {
    process.send!({method: msg.method, result: res});
  } else {
    process.send!({method: msg.method, error:  res});
  }
};