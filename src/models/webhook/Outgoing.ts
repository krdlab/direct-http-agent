import fetch from "node-fetch";
import { IWebhookConfig } from "../entities";
import { DirectEvent } from "./DirectEvent";

export class Outgoing {
  constructor(private readonly config: IWebhookConfig) {
  }

  async execute(event: DirectEvent) {
    const res  = await fetch(this.url, this.options(event));
    return await res.json();
  }

  private get url() {
    return this.config.url;
  }

  private options(event: DirectEvent) {
    return {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(event)
    };
  }

  private get method() {
    return (this.config.method || "GET").toUpperCase();
  }

  private get headers() {
    return this.config.headers;
  }
}