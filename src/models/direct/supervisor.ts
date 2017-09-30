import * as cluster from "cluster";
import { EventEmitter } from "events";
import { IUser } from "../entities";
import * as data from "./data";
import { DirectClientProxy } from "./client-proxy";

cluster.setupMaster({
  exec: `${__dirname}/client-process.js`
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
    return Promise.resolve("");
  }

  private _closeIfNeeded(client?: DirectClientProxy): Promise<string> {
    if (client) {
      this._unregister(client);
      return client.close();
    } else {
      return this._success();
    }
  }

  startClientAs(user: IUser): Promise<string> {
    const c = this.findClientByUserId(user.directUserId);
    if (c) {
      return this._success(); // TODO
    } else {
      const newWorker = cluster.fork();
      const newClient = new DirectClientProxy(user, newWorker);
      this._register(newClient);
      return newClient.start();
    }
  }

  findClientByUserId(userId: string): DirectClientProxy | undefined {
    return this.clients.get(userId);
  }

  restartClient(user: IUser): Promise<string> {
    const c = this.findClientByUserId(user.directUserId);
    return this._closeIfNeeded(c).then(() => this.startClientAs(user));
  }

  removeClient(user: IUser): Promise<string> {
    const c = this.findClientByUserId(user.directUserId);
    return this._closeIfNeeded(c);
  }
}