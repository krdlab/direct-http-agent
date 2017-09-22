
export interface IWebhookConfig {
  method: string;
  url: string;
  contentType: string;
  authorization?: string;
  body?: string;
}

export interface IWebhookEvent {
  domainId: string;
  talkId: string;
  trigger: string;
}

export interface IWebhook {
  name: string;
  config: IWebhookConfig;
  event: IWebhookEvent;
}

export interface IUser {
  name: string;
  apiToken: string;
  oidcAccessToken: string;
  directApiToken: string;
  webhooks: Array<IWebhook>;
  createdAt: Date;
  updatedAt: Date;
}