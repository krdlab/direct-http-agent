
class DirectEvent {
  constructor(domainId, talkId, authorId, content, ds2hl) {
    this.domainId = domainId;
    this.talkId = talkId;
    this.authorId = authorId;
    this.content = content;
    this.ds2hl = ds2hl; // decimal string to high-low string
  }

  match(webhook) { // ::self => Webhook -> Boolean 
    return this.domainId === this.ds2hl(webhook.event.domainId)
      && this.talkId === this.ds2hl(webhook.event.talkId)
      && this.content.includes(webhook.event.trigger);
  }
}

module.exports = DirectEvent;