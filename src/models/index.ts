import { IUser, IUserModel, User, IWebhookModel, Webhook } from "./entities";
import * as webhook from "./webhook";
import { DirectClientManager as Supervisor } from "./direct/supervisor";
import { DirectClientProxy } from "./direct/client-proxy";
import * as crypto from "crypto";
import fetch from "node-fetch";

const DIRECT_REST_API_ENDPOINT = "https://api.direct4b.com/albero-app-server";
const supervisor = new Supervisor();

const genToken =
  (size: number) =>
    crypto.randomBytes(size / 2).toString("hex");

export async function passportAuthorized(iss: string, sub: string, profile: any, oidcAccessToken: string, refreshToken?: string, next?: any) { // FIXME
  try {
    const directApiToken = await fetchDirectAccessToken(oidcAccessToken);
    const user = await findOrCreateUserById(sub, profile, oidcAccessToken, directApiToken);
    supervisor.startClientAs(user);
    next(null, user);
  } catch (err) {
    next(err);
  }
}

const fetchDirectAccessToken = async (oidcAccessToken: string): Promise<string> => {
  const options = {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${oidcAccessToken}`
    }
  };
  const res  = await fetch(`${DIRECT_REST_API_ENDPOINT}/api_access_tokens`, options);
  const json = await res.json();
  return json.access_token;
};

const findOrCreateUserById = async (id: string, profile: any, oidcAccessToken: string, directApiToken: string): Promise<IUser> => {
  const u = await User.findOne({ directUserId: id }).exec();
  return await user(u, id, profile, oidcAccessToken, directApiToken).save();
};

const user = (user: IUserModel | null, id: string, profile: any, oidcAccessToken: string, directApiToken: string) => {
  // console.log(profile);
  if (user) {
    // NOTE: 既存ユーザーであれば情報を更新
    user.name = profile.displayName;
    user.oidcAccessToken = oidcAccessToken;
    user.directApiToken = directApiToken;
    user.updatedAt = new Date();
    return user;
  } else {
    // NOTE: 新規ユーザーであれば情報を作成
    return new User({
      name: profile.displayName,
      apiToken: genToken(32),
      oidcAccessToken: oidcAccessToken,
      directUserId: id,
      directApiToken: directApiToken
    });
  }
};

export async function findUserByApiToken(apiToken: string): Promise<IUser | null> {
  return await User.where("apiToken", apiToken).findOne().exec();
}

export function findClientByUser(user: IUser): DirectClientProxy | undefined {
  return supervisor.findClientByUserId(user.directUserId);
}

export async function restartClient(user: IUser): Promise<string> {
  return supervisor.restartClient(user);
}

export async function deleteUser(user: IUser): Promise<void> {
  await supervisor.removeClient(user);
  await User.remove({directUserId: user.directUserId}).exec();
}

export { DirectClientProxy };
export const addWebhook = webhook.add;
export const getWebhooks = webhook.getAll;
export const deleteWebhook = webhook.remove;