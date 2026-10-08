import Notification from '../models/Notification.js';

export async function notify(user, title, message, type = 'system') {
  if (!user) return;
  try {
    await Notification.create({ user, title, message, type });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
}
