const db = require('../db');
const DirectEvent = require('./direct-event');
const Outgoing = require('./outgoing');

module.exports = {
  DirectEvent,
  Outgoing,

  async add(user, input) { // :: User -> Webhook -> Promise Webhook
    const u = await db.User.findById(user._id).exec();

    const index = u.webhooks.length;
    u.webhooks.push(new db.Webhook({
      name: input.name,
      config: new db.WebhookConfig(input.config),
      event: new db.WebhookEvent(input.event)
    }));

    await u.save();
    return u.webhooks[index];
  },

  async findByEvent(userId, event) { // :: UserId -> DirectEvent -> Promise [Outgoing]
    const user = await db.User.findById(userId).exec();
    return user.webhooks
      .filter(hook => event.match(hook))
      .map(hook => new Outgoing(hook));
  },

  async getAll(user) {
    const u = await db.User.findById(user._id).exec();
    return u.webhooks;
  },

  async remove(user, webhookId) {
    const u = await db.User.findById(user._id).exec();
    const wh = u.webhooks.id(webhookId);
    if (wh) {
      wh.remove();
      await u.save();
      return { _id: webhookId, removed: true };
    } else {
      return { _id: webhookId, removed: false };
    }
  }
}