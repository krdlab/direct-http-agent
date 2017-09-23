import * as cluster from 'cluster';
import { EventEmitter } from 'events';
import { IUserModel } from '../entities';
import * as data from './data';
import { DirectClientProxy } from './client-proxy';

cluster.setupMaster({
  exec: `${__dirname}/client-process.ts`
});

export class DirectClientManager {
  private clients: Map<string, DirectClientProxy>;

  constructor() {
    this.clients = new Map<string, DirectClientProxy>();
  }

  private _register(client: DirectClientProxy) {
    this.clients.set(client.userId, client);
  }

  private _unregister(client: DirectClientProxy) {
    this.clients.delete(client.userId);
  }

  private _success() {
    return Promise.resolve('');
  }

  private _closeIfNeeded(client?: DirectClientProxy): Promise<string> {
    if (client == null) {
      return this._success();
    } else {
      this._unregister(client);
      return client.close();
    }
  }

  startAs(user: IUserModel): Promise<string> {
    const c = this.findByUserId(user._id);
    if (c == null) {
      const newWorker = cluster.fork();
      const newClient = new DirectClientProxy(user, newWorker);
      this._register(newClient);
      return newClient.start();
    } else {
      // TODO
      return this._success();
    }
  }

  restart(user: IUserModel): Promise<any> {
    const c = this.findByUserId(user._id);
    return this._closeIfNeeded(c).then(() => this.startAs(user));
  }

  findByUserId(userId: string): DirectClientProxy {
    return this.clients.get(userId);
  }

  removeClient(user: IUserModel): Promise<string> {
    const c = this.findByUserId(user._id);
    return this._closeIfNeeded(c);
  }
}