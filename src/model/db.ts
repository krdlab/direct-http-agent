import { Schema, Document, Model, model, connect, Types } from 'mongoose';
import { IUser, IWebhook, IWebhookConfig, IWebhookEvent } from './interfaces';

const MONGODB_HOST = process.env.NODE_MONGODB_HOST || 'localhost';
// TODO: mongoose.Promise = global.Promise;
connect(`mongodb://${MONGODB_HOST}/direct`);

export interface IWebhookConfigModel extends IWebhookConfig, Document {}
const WebhookConfigSchema = new Schema({
  method: { type: String, default: 'POST' },
  url: String,
  contentType: { type: String, default: 'application/json' },
  authorization: String,
  body: String
});
export const WebhookConfig = model<IWebhookConfigModel>('WebhookConfig', WebhookConfigSchema);

export interface IWebhookEventModel extends IWebhookEvent, Document {}
const WebhookEventSchema = new Schema({
  domainId: String,
  talkId: String,
  trigger: String
});
export const WebhookEvent = model<IWebhookEventModel>('WebhookEvent', WebhookEventSchema);

export interface IWebhookModel extends IWebhook, Document {}
const WebhookSchema = new Schema({
  name: String,
  config: { type: WebhookConfigSchema },
  event: { type: WebhookEventSchema }
});
export const Webhook = model<IWebhookModel>('Webhook', WebhookSchema);

export interface IUserModel extends IUser, Document {
  webhooks: Types.DocumentArray<IWebhookModel>;
}
const UserSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  apiToken: { type: String, required: true, index: true },
  oidcAccessToken: { type: String, required: true },
  directApiToken: { type: String, required: true, index: true },
  webhooks: { type: [WebhookSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export const User: Model<IUserModel> = model<IUserModel>('User', UserSchema);