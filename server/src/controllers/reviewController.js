import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Farmhouse from '../models/Farmhouse.js';

export async function listReviews(req, res) {
  const reviews = await Review.find({ farmhouse: req.params.farmhouseId }).populate('user', 'name avatar').sort({ createdAt: -1 });
  res.json({ reviews });
}

export async function createReview(req, res) {
  try {
    const { rating, comment, bookingId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, farmhouse: req.params.farmhouseId, status: 'confirmed', paymentStatus: 'paid' });
    if (!booking) return res.status(403).json({ message: 'Review is available only after owner confirmation and successful payment.' });
    const existing = await Review.findOne({ farmhouse: booking.farmhouse, user: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already reviewed this farmhouse.' });
    const review = await Review.create({ farmhouse: booking.farmhouse, user: req.user._id, booking: booking._id, rating: Number(rating), comment });
    const stats = await Review.aggregate([{ $match: { farmhouse: booking.farmhouse } }, { $group: { _id: '$farmhouse', average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
    const current = stats[0] || { average: 0, count: 0 };
    await Farmhouse.findByIdAndUpdate(booking.farmhouse, { rating: Number(current.average.toFixed(1)), reviewCount: current.count });
    res.status(201).json({ message: 'Review published.', review: await review.populate('user', 'name avatar') });
  } catch (error) { res.status(400).json({ message: 'Could not publish review.', error: error.message }); }
}
