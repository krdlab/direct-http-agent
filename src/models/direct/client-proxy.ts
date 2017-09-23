import { Worker } from 'cluster';
import { EventEmitter } from 'events';
import { IUserModel } from '../entities';
import { Domain, Talk } from './data';

export class DirectClientProxy {
  private user: IUserModel;
  private worker: Worker;
  private response: EventEmitter;

  constructor(user: IUserModel, worker: Worker) {
    this.user = user;
    this.worker = worker;
    this.response = new EventEmitter();
    this._handleMessage = this._handleMessage.bind(this);

    this.worker.on('message', this._handleMessage);
  }

  private _handleMessage(msg: any) {
    this.response.emit(msg.method, msg);
  }

  get userId(): string {
    return this.user._id;
  }

  start(): Promise<string> {
    const method = 'start';
    const user = this.user;
    return new Promise((resolve, reject) => {
      this.worker.send({method, user});
      this.response.once('start', (msg) => {
        resolve(msg.result);
      });
    });
  }

  close(): Promise<string> {
    return new Promise((resolve, reject) => {
      const pid = this.worker.id;
      this.worker.kill();
      this.worker.on('exit', (code, signal) => {
        console.log(`worker killed: pid = ${pid}, code = ${code}, signal = ${signal}`);
        resolve('closed');
      });
    });
  }

  getDomains(): Promise<Domain[]> {
    return new Promise((resolve, reject) => {
      this.worker.send({method: 'getDomains'});
      this.response.once('getDomains', (msg) => {
        resolve(msg.result);
      });
    });
  }

  getTalks(domainId: string): Promise<Talk[]> {
    return new Promise((resolve, reject) => {
      this.worker.send({method: 'getTalks', domainId});
      this.response.once('getTalks', (msg) => {
        resolve(msg.result);
      });
    });
  }

  sendTextMessage(domainId: string, talkId: string, content: string): Promise<string> {
    const method = 'sendTextMessage';
    return new Promise((resolve, reject) => {
      this.worker.send({method, domainId, talkId, content});
      this.response.once(method, (msg) => {
        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.result);
        }
      });
    });
  }
}