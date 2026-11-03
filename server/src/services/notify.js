import { Notification } from '../models/index.js';
import { sendEmail } from './email.js';
export async function notify(user, { title, message, type = 'info', entity, email }) {
  await Notification.create({ recipient: user._id, title, message, type, relatedEntity: entity });
  if (email) await sendEmail(user.email, ...email);
}
