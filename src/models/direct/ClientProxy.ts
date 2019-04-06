import { Worker } from "cluster";
import { EventEmitter } from "events";
import { IUser } from "../entities";
import { Domain, Talk } from "./Types";
import * as t from "./Types";

export class DirectClientProxy {
  private response: EventEmitter;

  constructor(private readonly user: IUser, private readonly worker: Worker) {
    this.response = new EventEmitter();
    this._handleMessage = this._handleMessage.bind(this);

    this.worker.on("message", this._handleMessage);
  }

  private _handleMessage(msg: any) {
    this.response.emit(msg.method, msg);
  }

  get userId(): string {
    return this.user.directUserId;
  }

  start(): Promise<string> {
    const start: t.IStart = {
      method: "start",
      user: this.user
    };
    return new Promise((resolve, reject) => {
      this.worker.send(start);
      this.response.once(start.method, (msg) => {
        resolve(msg.result);
      });
    });
  }

  close(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pid = this.worker.id;
      this.worker.kill();
      this.worker.on("exit", (code, signal) => {
        console.log(`worker killed: pid = ${pid}, code = ${code}, signal = ${signal}`);
        resolve("closed");
      });
    });
  }

  getDomains(): Promise<Domain[]> {
    const getDomains: t.IGetDomains = {
      method: "getDomains"
    };
    return new Promise((resolve, reject) => {
      this.worker.send(getDomains);
      this.response.once(getDomains.method, (msg) => {
        resolve(msg.result);
      });
    });
  }

  getTalks(domainId: string): Promise<Talk[]> {
    const getTalks: t.IGetTalks = {
      method: "getTalks",
      domainId
    };
    return new Promise((resolve, reject) => {
      this.worker.send(getTalks);
      this.response.once(getTalks.method, (msg) => {
        resolve(msg.result);
      });
    });
  }

  sendTextMessage(domainId: string, talkId: string, content: string): Promise<string> {
    const sendTextMessage: t.ISendTextMessage = {
      method: "sendTextMessage",
      domainId, talkId, content
    };
    return new Promise((resolve, reject) => {
      this.worker.send(sendTextMessage);
      this.response.once(sendTextMessage.method, (msg) => {
        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.result);
        }
      });
    });
  }
}