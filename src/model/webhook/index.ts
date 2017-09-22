import { User, IUserModel, Webhook, WebhookConfig, WebhookEvent } from '../db';
import { IWebhook } from '../interfaces';
import { DirectEvent } from './direct-event';
import { Outgoing } from './outgoing';


export async function add(user: IUserModel, input: IWebhook) {
  const u = await User.findById(user._id).exec();

  const index = u.webhooks.length;
  u.webhooks.push(new Webhook({
    name: input.name,
    config: new WebhookConfig(input.config),
    event: new WebhookEvent(input.event)
  }));

  await u.save();
  return u.webhooks[index];
}

export async function findByEvent(userId: string, event: DirectEvent) {
  const user = await User.findById(userId).exec();
  return user.webhooks
    .filter(hook => event.match(hook))
    .map(hook => new Outgoing(hook));
}

export async function getAll(user: IUserModel) {
  const u = await User.findById(user._id).exec();
  return u.webhooks;
}

export async function remove(user: IUserModel, webhookId: string) {
  const u = await User.findById(user._id).exec();
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