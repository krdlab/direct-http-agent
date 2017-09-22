import * as cluster from 'cluster';
import { EventEmitter } from 'events';
import { IUserModel } from './db';

cluster.setupMaster({
  exec: './src/model/direct.js'
});

export class DirectClientManager {
  clients: Map<string, DirectClient>;

  constructor() {
    this.clients = new Map<string, DirectClient>();
  }

  _register(client: DirectClient) {
    this.clients.set(client.userId, client);
  }

  _unregister(client: DirectClient) {
    this.clients.delete(client.userId);
  }

  _success() {
    return new Promise((r, _) => { r(); });
  }

  _closeIfNeeded(client?: DirectClient) {
    if (client == null) {
      return this._success();
    } else {
      this._unregister(client);
      return client.close();
    }
  }

  startAs(user: IUserModel) {
    const c = this.findByUserId(user._id);
    if (c == null) {
      const newWorker = cluster.fork();
      const newClient = new DirectClient(user, newWorker);
      this._register(newClient);
      return newClient.start();
    } else {
      // TODO
      return this._success();
    }
  }

  restart(user: IUserModel) {
    const c = this.findByUserId(user._id);
    return this._closeIfNeeded(c).then(_ => this.startAs(user));
  }

  findByUserId(userId: string) {
    return this.clients.get(userId);
  }

  removeClient(user: IUserModel) {
    const c = this.findByUserId(user._id);
    return this._closeIfNeeded(c);
  }
}

class DirectClient {
  user: IUserModel;
  worker: cluster.Worker;
  response: EventEmitter;

  constructor(user: IUserModel, worker: cluster.Worker) {
    this.user = user;
    this.worker = worker;
    this.response = new EventEmitter();
    this._handleMessage = this._handleMessage.bind(this);

    this.worker.on('message', this._handleMessage);
  }

  _handleMessage(msg: any) {
    this.response.emit(msg.method, msg);
  }

  get userId(): string {
    return this.user._id;
  }

  start() { // :: self => Promise ()
    const user = this.user;
    return new Promise((resolve, reject) => {
      this.worker.send({method: 'start', user});
      this.response.once('start', (msg) => {
        resolve(msg.result);
      });
    });
  }

  close() { // :: self => Promise ()
    return new Promise((resolve, reject) => {
      const pid = this.worker.id;
      this.worker.kill();
      this.worker.on('exit', (code, signal) => {
        console.log(`worker killed: pid = ${pid}, code = ${code}, signal = ${signal}`);
        resolve();
      });
    });
  }

  getDomains() {
    return new Promise((resolve, reject) => {
      this.worker.send({method: 'getDomains'});
      this.response.once('getDomains', (msg) => {
        resolve(msg.result);
      });
    });
  }

  getTalks(domainId: string) {
    return new Promise((resolve, reject) => {
      this.worker.send({method: 'getTalks', domainId});
      this.response.once('getTalks', (msg) => {
        resolve(msg.result);
      });
    });
  }

  sendTextMessage(domainId: string, talkId: string, content: string) {
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