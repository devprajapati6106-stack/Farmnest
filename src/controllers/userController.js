import User from '../models/User.js';
import Farmhouse from '../models/Farmhouse.js';
import Notification from '../models/Notification.js';
import bcrypt from 'bcryptjs';

export async function getProfile(req, res) {
  const user = await User.findById(req.user._id).select('-password').populate('favorites', 'title city images pricePerNight rating reviewCount');
  res.json({ user });
}

export async function updateProfile(req, res) {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true }).select('-password');
    res.json({ message: 'Profile updated successfully.', user });
  } catch (error) {
    res.status(400).json({ message: 'Could not update profile.', error: error.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Provide both passwords. New password must be at least 6 characters.' });
    const user = await User.findById(req.user._id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(400).json({ message: 'Could not change password.', error: error.message });
  }
}

export async function toggleFavorite(req, res) {
  const farmhouse = await Farmhouse.findOne({ _id: req.params.farmhouseId, status: 'approved' });
  if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });
  const user = await User.findById(req.user._id);
  const id = String(farmhouse._id);
  const exists = user.favorites.some(item => String(item) === id);
  if (exists) user.favorites = user.favorites.filter(item => String(item) !== id);
  else user.favorites.push(farmhouse._id);
  await user.save();
  res.json({ message: exists ? 'Removed from wishlist.' : 'Added to wishlist.', favorite: !exists });
}

export async function wishlist(req, res) {
  const user = await User.findById(req.user._id).populate('favorites', 'title city images pricePerNight rating reviewCount guests bedrooms bathrooms');
  res.json({ favorites: user.favorites || [] });
}

export async function notifications(req, res) {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications: items, unread });
}

export async function markNotificationsRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'Notifications marked as read.' });
}
