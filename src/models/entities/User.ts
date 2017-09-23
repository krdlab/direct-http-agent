import { Schema, Document, Model, model, connect, Types } from 'mongoose';
import { IWebhook, IWebhookModel, WebhookSchema } from './Webhook';

export interface IUser {
  name: string;
  apiToken: string;
  oidcAccessToken: string;
  directUserId: string;
  directApiToken: string;
  webhooks: Array<IWebhook>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends IUser, Document {
  webhooks: Types.DocumentArray<IWebhookModel>;
}

const UserSchema = new Schema({
  name: { type: String, required: true },
  apiToken: { type: String, required: true, index: true },
  oidcAccessToken: { type: String, required: true },
  directUserId: { type: String, required: true, unique: true },
  directApiToken: { type: String, required: true, index: true },
  webhooks: { type: [WebhookSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User: Model<IUserModel> = model<IUserModel>('User', UserSchema);