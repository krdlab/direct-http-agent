import { IWebhook } from "../entities";

export class DirectEvent {
  constructor(
    private readonly domainId: string,
    private readonly talkId: string,
    private readonly authorId: string,
    private readonly content: string
  ) {
  }

  match(webhook: IWebhook): boolean {
    const re = new RegExp(webhook.event.trigger);
    return this.domainId === webhook.event.domainId
      && this.talkId === webhook.event.talkId
      && re.test(this.content);
  }
}
