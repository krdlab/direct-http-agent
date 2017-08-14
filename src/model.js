const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

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
  accessToken: String,
  webhooks: { type: [webHookSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const WebHook = mongoose.model('WebHook', webHookSchema);

const _user = (user, profile, accessToken) => {
  console.log(profile);
  if (user) {
    // NOTE: 既存ユーザーであれば情報を更新
    user.name = profile.display_name;
    user.accessToken = accessToken;
    user.updatedAt = new Date();
    return user;
  } else {
    // NOTE: 新規ユーザーであれば情報を作成
    return new model.User({
      _id: sub,
      name: profile.display_name,
      apiToken: crypto.randomBytes(16).toString('hex'),
      accessToken: accessToken
    });
  }
};

const findOrCreateUserById = async (id, profile, accessToken) => {
  const res  = await User.findById(id).exec();
  return await _user(res, profile, accessToken).save();
};

module.exports = {
  User: User,
  WebHook: WebHook,
  findOrCreateUserById: findOrCreateUserById
};
