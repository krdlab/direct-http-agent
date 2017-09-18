const fetch = require('node-fetch');

class Outgoing {
  constructor(webhook) {
    this.config = webhook.config;
  }

  _options() {
    const method = (this.config.method || 'GET').toUpperCase();
    const contentType = (this.config.contentType || 'application/x-www-form-urlencoded');
    const options = {
      method,
      headers: {
        'Content-Type': contentType
      }
    };
    if (this.config.authorization) {
      options.headers.Authorization = this.config.authorization;
    }
    if (this.config.body) {
      options.body = this.config.body;
    }
    return options;
  }

  async execute() { // :: self => Promise Any
    const res  = await fetch(this.config.url, this._options());
    const json = await res.json();
    return json;
  }
}

module.exports = Outgoing;