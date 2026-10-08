import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmhouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmhouse', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true }
}, { timestamps: true });

reviewSchema.index({ user: 1, farmhouse: 1 }, { unique: true });
export default mongoose.model('Review', reviewSchema);
