import { IUser, IUserModel, User, IWebhookModel, Webhook } from "./entities";
import { DirectClientManager as Supervisor } from "./direct/Supervisor";

export async function bootClients(supervisor: Supervisor): Promise<void> {
  const users = await User.find().exec();
  users.forEach(user => { supervisor.startClientAs(user); });
}