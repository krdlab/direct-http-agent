import { Schema, Document, Model, model, connect, Types } from "mongoose";

export interface IWebhookConfig {
  method: string;
  url: string;
  contentType: string;
  authorization?: string;
  body?: string;
}

export interface IWebhookEvent {
  domainId: string;
  talkId: string;
  trigger: string;
}

export interface IWebhook {
  name: string;
  config: IWebhookConfig;
  event: IWebhookEvent;
}

export interface IWebhookConfigModel extends IWebhookConfig, Document {}
export interface IWebhookEventModel extends IWebhookEvent, Document {}
export interface IWebhookModel extends IWebhook, Document {}

const WebhookConfigSchema = new Schema({
  method: { type: String, default: "POST" },
  url: String,
  contentType: { type: String, default: "application/json" },
  authorization: String,
  body: String
});

const WebhookEventSchema = new Schema({
  domainId: String,
  talkId: String,
  trigger: String
});

export const WebhookSchema = new Schema({
  name: String,
  config: { type: WebhookConfigSchema },
  event: { type: WebhookEventSchema }
});

export const WebhookConfig = model<IWebhookConfigModel>("WebhookConfig", WebhookConfigSchema);
export const WebhookEvent = model<IWebhookEventModel>("WebhookEvent", WebhookEventSchema);
export const Webhook = model<IWebhookModel>("Webhook", WebhookSchema);