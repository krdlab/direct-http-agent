const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const crypto   = require('crypto');

const MONGODB_HOST = process.env.NODE_MONGODB_HOST || 'localhost';

mongoose.connect(`mongodb://${MONGODB_HOST}/direct`);
const Schema = mongoose.Schema;

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
  directApiToken: String,
  webhooks: { type: [webHookSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const WebHook = mongoose.model('WebHook', webHookSchema);

const _user = (user, id, profile, oidcAccessToken, directApiToken) => {
  console.log(profile);
  if (user) {
    // NOTE: 既存ユーザーであれば情報を更新
    user.name = profile.display_name;
    user.oidcAccessToken = oidcAccessToken;
    user.directApiToken = directApiToken;
    user.updatedAt = new Date();
    return user;
  } else {
    // NOTE: 新規ユーザーであれば情報を作成
    return new User({
      _id: id,
      name: profile.display_name,
      apiToken: crypto.randomBytes(16).toString('hex'),
      oidcAccessToken: oidcAccessToken,
      directApiToken: directApiToken
    });
  }
};

const fetch = require('node-fetch');
const DIRECT_REST_API_ENDPOINT = 'https://api.direct4b.com/albero-app-server';
const fetchDirectAccessToken = async (oidcAccessToken) => {
  const res  = await fetch(`${DIRECT_REST_API_ENDPOINT}/api_access_tokens`, {method: 'POST', headers: {'Authorization': `Bearer ${oidcAccessToken}`}});
  const json = await res.json();
  return json.access_token;
};

const findOrCreateUserById = async (id, profile, oidcAccessToken, directApiToken) => {
  const res  = await User.findById(id).exec();
  return await _user(res, id, profile, oidcAccessToken, directApiToken).save();
};

const findUserByApiToken = async (apiToken) => {
  return await User.where({ apiToken }).findOne().exec();
};

const ClientManager = require('./direct');
const clientManager = new ClientManager();

const passportAuthorized = async (iss, sub, profile, oidcAccessToken, refreshToken, next) => {
  try {
    const directApiToken = await fetchDirectAccessToken(oidcAccessToken);
    const user = await findOrCreateUserById(sub, profile, oidcAccessToken, directApiToken);
    clientManager.startAs(user);
    next(null, user);
  } catch (err) {
    next(err);
  }
};

const findClientByUser = (user) => {
  return clientManager.findByUserId(user._id);
};

const restartClient = (user) => {
  return clientManager.restart(user);
};

module.exports = {
  User: User,
  WebHook: WebHook,
  findOrCreateUserById: findOrCreateUserById,
  findUserByApiToken: findUserByApiToken,
  passportAuthorized: passportAuthorized,
  findClientByUser: findClientByUser,
  restartClient: restartClient
};
