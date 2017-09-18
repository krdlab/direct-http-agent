const db = require('./db');
const webhook = require('./webhook');
const Supervisor = require('./supervisor');
const crypto = require('crypto');
const fetch = require('node-fetch');

const DIRECT_REST_API_ENDPOINT = 'https://api.direct4b.com/albero-app-server';
const supervisor = new Supervisor();

const passportAuthorized = async (iss, sub, profile, oidcAccessToken, refreshToken, next) => {
  try {
    const directApiToken = await fetchDirectAccessToken(oidcAccessToken);
    const user = await findOrCreateUserById(sub, profile, oidcAccessToken, directApiToken);
    supervisor.startAs(user);
    next(null, user);
  } catch (err) {
    next(err);
  }
};

const fetchDirectAccessToken = async (oidcAccessToken) => {
  const res  = await fetch(`${DIRECT_REST_API_ENDPOINT}/api_access_tokens`, {method: 'POST', headers: {'Authorization': `Bearer ${oidcAccessToken}`}});
  const json = await res.json();
  return json.access_token;
};

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
    return new db.User({
      _id: id,
      name: profile.display_name,
      apiToken: genToken(32),
      oidcAccessToken: oidcAccessToken,
      directApiToken: directApiToken
    });
  }
};

const genToken = (size) => crypto.randomBytes(size / 2).toString('hex');

const findOrCreateUserById = async (id, profile, oidcAccessToken, directApiToken) => {
  const res  = await db.User.findById(id).exec();
  return await _user(res, id, profile, oidcAccessToken, directApiToken).save();
};

const findUserByApiToken = async (apiToken) => {
  return await db.User.where({ apiToken }).findOne().exec();
};

const findClientByUser = (user) => {
  return supervisor.findByUserId(user._id);
};

const restartClient = (user) => {
  return supervisor.restart(user);
};

const deleteUser = async (user) => {
  await supervisor.removeClient(user);
  await db.User.deleteOne({_id: user._id}).exec();
};

module.exports = {
  User: db.User,
  WebHook: db.WebHook,
  findOrCreateUserById: findOrCreateUserById,
  findUserByApiToken: findUserByApiToken,
  passportAuthorized: passportAuthorized,
  findClientByUser: findClientByUser,
  restartClient: restartClient,
  deleteUser: deleteUser,
  addWebhook: webhook.add,
  getWebhooks: webhook.getAll,
  deleteWebhook: webhook.remove
};