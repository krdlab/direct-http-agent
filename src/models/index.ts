import { IUserModel, User, IWebhookModel, Webhook } from './entities';
import * as webhook from './webhook';
import { DirectClientManager as Supervisor } from './direct/supervisor';
import { DirectClientProxy } from './direct/client-proxy';
import * as crypto from 'crypto';
import 'node-fetch';

const DIRECT_REST_API_ENDPOINT = 'https://api.direct4b.com/albero-app-server';
const supervisor = new Supervisor();

export async function passportAuthorized(iss: string, sub: string, profile: any, oidcAccessToken: string, refreshToken?: string, next?: any) {
  try {
    const directApiToken = await fetchDirectAccessToken(oidcAccessToken);
    const user = await findOrCreateUserById(sub, profile, oidcAccessToken, directApiToken);
    supervisor.startAs(user);
    next(null, user);
  } catch (err) {
    next(err);
  }
};

const fetchDirectAccessToken = async (oidcAccessToken: string) => {
  const res  = await fetch(`${DIRECT_REST_API_ENDPOINT}/api_access_tokens`, {method: 'POST', headers: {'Authorization': `Bearer ${oidcAccessToken}`}});
  const json = await res.json();
  return json.access_token;
};

const _user = (user: IUserModel | null, id: string, profile: any, oidcAccessToken: string, directApiToken: string) => {
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
      apiToken: genToken(32),
      oidcAccessToken: oidcAccessToken,
      directApiToken: directApiToken
    });
  }
};

const genToken = (size: number) => crypto.randomBytes(size / 2).toString('hex');

const findOrCreateUserById = async (id: string, profile: any, oidcAccessToken: string, directApiToken: string) => {
  const res  = await User.findById(id).exec();
  return await _user(res, id, profile, oidcAccessToken, directApiToken).save();
};

export async function findUserByApiToken(apiToken: string) {
  return await User.where('apiToken', apiToken).findOne().exec();
};

export function findClientByUser(user: IUserModel) {
  return supervisor.findByUserId(user._id);
};

export async function restartClient(user: IUserModel) {
  return supervisor.restart(user);
};

export async function deleteUser(user: IUserModel) {
  await supervisor.removeClient(user);
  await User.remove({_id: user._id}).exec();
};

export { DirectClientProxy };
export const addWebhook = webhook.add;
export const getWebhooks = webhook.getAll;
export const deleteWebhook = webhook.remove;