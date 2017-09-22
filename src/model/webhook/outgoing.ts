import 'node-fetch';
import { IWebhook, IWebhookConfig } from '../interfaces';

interface FetchOptions {
  method: string;
  headers: {
    'Content-Type': string,
    Authorization?: string
  };
  body?: string;
}

export class Outgoing {
  config: IWebhookConfig;

  constructor(webhook: IWebhook) {
    this.config = webhook.config;
  }

  _options() {
    const method = (this.config.method || 'GET').toUpperCase();
    const contentType = (this.config.contentType || 'application/x-www-form-urlencoded');
    let options: FetchOptions = {
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

  async execute() {
    const res  = await fetch(this.config.url, this._options());
    const json = await res.json();
    return json;
  }
}