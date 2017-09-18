const cluster = require('cluster');
const EventEmitter = require('events');

cluster.setupMaster({
  exec: './src/model/direct.js'
});

class DirectClientManager {
  constructor() {
    this.clients = {}; // :: Map String Worker
  }

  _register(client) {
    this.clients[client.userId] = client;
  }

  _unregister(client) {
    delete this.clients[client.userId];
  }

  _success() {
    return new Promise((r, _) => { r(); });
  }

  _closeIfNeeded(client) {
    if (client == null) {
      return this._success();
    } else {
      this._unregister(client);
      return client.close();
    }
  }

  startAs(user) { // :: self => User -> Promise ()
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

  restart(user) {
    const c = this.findByUserId(user._id);
    return this._closeIfNeeded(c).then(_ => this.startAs(user));
  }

  findByUserId(userId) { // :: self => String -> DirectClient
    return this.clients[userId];
  }

  removeClient(user) {
    const c = this.findByUserId(user._id);
    return this._closeIfNeeded(c);
  }
}

class DirectClient {
  constructor(user, worker) {
    this.user = user;
    this.worker = worker;
    this.response = new EventEmitter();
    this._handleMessage = this._handleMessage.bind(this);

    this.worker.on('message', this._handleMessage);
  }

  _handleMessage(msg) {
    this.response.emit(msg.method, msg);
  }

  get userId() {
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

  getTalks(domainId) { // :: self => String -> Promise [Talk]
    return new Promise((resolve, reject) => {
      this.worker.send({method: 'getTalks', domainId});
      this.response.once('getTalks', (msg) => {
        resolve(msg.result);
      });
    });
  }

  sendTextMessage(domainId, talkId, content) {
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

module.exports = DirectClientManager;