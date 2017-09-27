import { IUser } from '../entities';

export interface IStart {
  method: "start";
  user: IUser;
}

export interface IGetDomains {
  method: "getDomains";
}

export interface IGetTalks {
  method: "getTalks";
  domainId: string;
}

export interface ISendTextMessage {
  method: "sendTextMessage";
  domainId: string;
  talkId: string;
  content: string;
}

export type IpcMessage = IStart | IGetDomains | IGetTalks | ISendTextMessage;