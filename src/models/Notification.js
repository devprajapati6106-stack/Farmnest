import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['booking', 'farmhouse', 'payment', 'review', 'system'], default: 'system' },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
