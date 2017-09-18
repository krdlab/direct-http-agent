const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const MONGODB_HOST = process.env.NODE_MONGODB_HOST || 'localhost';

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${MONGODB_HOST}/direct`);

const WebhookConfigSchema = new Schema({
  method: { type: String, default: 'POST' },
  url: String,
  contentType: { type: String, default: 'application/json' },
  authorization: String,
  body: String
});
const WebhookEventSchema = new Schema({
  domainId: String,
  talkId: String,
  trigger: String
});
const WebhookSchema = new Schema({
  name: String,
  config: WebhookConfigSchema,
  event: WebhookEventSchema
});

const UserSchema = new Schema({
  _id: String,
  name: String,
  apiToken: { type: String, index: true },
  oidcAccessToken: String,
  directApiToken: { type: String, index: true },
  webhooks: { type: [WebhookSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WebhookConfig = mongoose.model('WebhookConfig', WebhookConfigSchema);
const WebhookEvent  = mongoose.model('WebhookEvent', WebhookEventSchema);
const Webhook       = mongoose.model('Webhook', WebhookSchema);
const User          = mongoose.model('User', UserSchema);

module.exports = { WebhookConfig, WebhookEvent, Webhook, User };