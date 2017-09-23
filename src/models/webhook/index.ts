import { User, IUser, IUserModel, Webhook, IWebhook, WebhookConfig, WebhookEvent } from '../entities';
import { DirectEvent } from './direct-event';
import { Outgoing } from './outgoing';


export async function add(user: IUserModel, input: IWebhook) {
  const u = await User.findById(user._id).exec();
  if (u == null) {
    return null;
  }
  const index = u.webhooks.length;
  u.webhooks.push(new Webhook({
    name: input.name,
    config: new WebhookConfig(input.config),
    event: new WebhookEvent(input.event)
  }));

  await u.save();
  return u.webhooks[index];
}

export async function findByEvent(user: IUser, event: DirectEvent) {
  const u = await User.findOne({ directUserId: user.directUserId }).exec();
  if (u == null) {
    return [];
  }
  return u.webhooks
    .filter(hook => event.match(hook))
    .map(hook => new Outgoing(hook));
}

export async function getAll(user: IUser) {
  const u = await User.findOne({ directUserId: user.directUserId }).exec();
  if (u == null) {
    return [];
  }
  return u.webhooks;
}

export async function remove(user: IUserModel, webhookId: string) {
  const u = await User.findById(user._id).exec();
  if (u == null) {
    return { _id: webhookId, removed: false };
  }
  const wh = u.webhooks.id(webhookId);
  if (wh) {
    wh.remove();
    await u.save();
    return { _id: webhookId, removed: true };
  } else {
    return { _id: webhookId, removed: false };
  }
}

export { DirectEvent, Outgoing };