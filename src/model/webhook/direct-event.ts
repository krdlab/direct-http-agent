import { IWebhook } from '../interfaces';

export class DirectEvent {
  domainId: string;
  talkId: string;
  authorId: string;
  content: string;
  ds2hl: (s: string) => string;

  constructor(domainId: string, talkId: string, authorId: string, content: string, ds2hl: (s: string) => string) {
    this.domainId = domainId;
    this.talkId = talkId;
    this.authorId = authorId;
    this.content = content;
    this.ds2hl = ds2hl; // decimal string to high-low string
  }

  match(webhook: IWebhook) { 
    return this.domainId === this.ds2hl(webhook.event.domainId)
      && this.talkId === this.ds2hl(webhook.event.talkId)
      && this.content.includes(webhook.event.trigger);
  }
}