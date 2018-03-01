import fetch from "node-fetch";
import { IWebhookConfig } from "../entities";

export class Outgoing {
  constructor(private readonly config: IWebhookConfig) {
  }

  async execute() {
    const res  = await fetch(this.url, this.options);
    return await res.json();
  }

  private get url() {
    return this.config.url;
  }

  private get options() {
    return {
      method: this.method,
      headers: this.headers,
      body: this.config.body
    };
  }

  private get method() {
    return (this.config.method || "GET").toUpperCase();
  }

  private get headers() {
    const hs: {[index: string]: string} = {
      "Content-Type": this.contentType
    };
    if (this.config.authorization) {
      hs["Authorization"] = this.config.authorization;
    }
    return hs;
  }

  private get contentType() {
    return (this.config.contentType || "application/x-www-form-urlencoded");
  }
}