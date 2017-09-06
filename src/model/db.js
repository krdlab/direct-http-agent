const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const MONGODB_HOST = process.env.NODE_MONGODB_HOST || 'localhost';

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://${MONGODB_HOST}/direct`);

const webHookSchema = new Schema({
  domain: String,
  talk: String,
  query: String,
  callbackUrl: String
});

const userSchema = new Schema({
  _id: String,
  name: String,
  apiToken: { type: String, index: true },
  oidcAccessToken: String,
  directApiToken: { type: String, index: true },
  webhooks: { type: [webHookSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WebHook = mongoose.model('WebHook', webHookSchema);
const User    = mongoose.model('User', userSchema);

module.exports = { WebHook, User };