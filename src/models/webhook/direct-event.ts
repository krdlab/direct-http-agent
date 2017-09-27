import { IWebhook } from "../entities";

type DecimalStringToHLString = (s: string) => string;

export class DirectEvent {
  private domainId: string;
  private talkId: string;
  private authorId: string;
  private content: string;
  private ds2hl: DecimalStringToHLString;

  constructor(domainId: string, talkId: string, authorId: string, content: string, ds2hl: DecimalStringToHLString) {
    this.domainId = domainId;
    this.talkId = talkId;
    this.authorId = authorId;
    this.content = content;
    this.ds2hl = ds2hl;
  }

  match(webhook: IWebhook): boolean {
    return this.domainId === this.ds2hl(webhook.event.domainId)
      && this.talkId === this.ds2hl(webhook.event.talkId)
      && this.content.includes(webhook.event.trigger);
  }
}