import { IWebhook } from "../entities";

type DecimalStringToHLString = (s: string) => string;

export class DirectEvent {
  constructor(
    private readonly domainId: string,
    private readonly talkId: string,
    private readonly authorId: string,
    private readonly content: string,
    private readonly ds2hl: DecimalStringToHLString
  ) {
  }

  match(webhook: IWebhook): boolean {
    return this.domainId === this.ds2hl(webhook.event.domainId)
      && this.talkId === this.ds2hl(webhook.event.talkId)
      && this.content.includes(webhook.event.trigger);
  }
}