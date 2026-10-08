import Farmhouse from '../models/Farmhouse.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { notify } from '../utils/notify.js';

export async function adminOverview(req, res) {
  const [farmhouses, bookings, users, reviews] = await Promise.all([
    Farmhouse.find().populate('owner', 'name email phone').sort({ createdAt: -1 }),
    Booking.find().populate('user', 'name email phone').populate('farmhouse').sort({ createdAt: -1 }),
    User.find().select('-password').sort({ createdAt: -1 }),
    Review.find().populate('user', 'name email').populate('farmhouse', 'title').sort({ createdAt: -1 })
  ]);
  const paidRevenue = bookings.filter(item => item.paymentStatus === 'paid').reduce((sum, item) => sum + item.totalAmount, 0);
  res.json({ farmhouses, bookings, users, reviews, stats: { farms: farmhouses.length, pendingFarms: farmhouses.filter(x => x.status === 'pending').length, bookings: bookings.length, users: users.length, paidBookings: bookings.filter(x => x.paymentStatus === 'paid').length, revenue: paidRevenue, reviews: reviews.length } });
}

export async function decideFarmhouse(req, res) {
  const { action, adminNote = '' } = req.body;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action.' });
  const status = action === 'approve' ? 'approved' : 'rejected';
  const farmhouse = await Farmhouse.findByIdAndUpdate(req.params.id, { status, isActive: action === 'approve', adminNote }, { new: true });
  if (!farmhouse) return res.status(404).json({ message: 'Farmhouse not found.' });
  await notify(farmhouse.owner, `Farmhouse ${status}`, `${farmhouse.title} has been ${status} by admin.`, 'farmhouse');
  res.json({ message: `Farmhouse ${status}.`, farmhouse });
}

export async function updateUserStatus(req, res) {
  if (String(req.user._id) === String(req.params.id)) return res.status(400).json({ message: 'You cannot suspend your own admin account.' });
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ message: 'Invalid user status.' });
  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  await notify(user._id, `Account ${status}`, status === 'suspended' ? 'Your account has been suspended by admin.' : 'Your account has been activated.', 'system');
  res.json({ message: `User ${status}.`, user });
}

export async function deleteReview(req, res) {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  const farmhouseId = review.farmhouse;
  await review.deleteOne();
  const stats = await Review.aggregate([{ $match: { farmhouse: farmhouseId } }, { $group: { _id: '$farmhouse', average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  const current = stats[0] || { average: 0, count: 0 };
  await Farmhouse.findByIdAndUpdate(farmhouseId, { rating: Number(current.average.toFixed(1)), reviewCount: current.count });
  res.json({ message: 'Review removed by admin.' });
}
