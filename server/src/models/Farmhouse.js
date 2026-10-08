import mongoose from 'mongoose';

const farmhouseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  pricePerNight: { type: Number, required: true, min: 1, default: 5000 },
  guests: { type: Number, required: true, min: 1 },
  bedrooms: { type: Number, default: 1, min: 1 },
  bathrooms: { type: Number, default: 1, min: 1 },
  amenities: { type: [String], default: [] },
  images: { type: [String], default: [] },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'inactive'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  adminNote: { type: String, default: '' },
  blockedDates: { type: [Date], default: [] },
  weekendPrice: { type: Number, default: 0, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 90 },
  taxPercent: { type: Number, default: 5, min: 0, max: 50 },
  serviceChargePercent: { type: Number, default: 2, min: 0, max: 30 },
  upiId: { type: String, default: '', trim: true },
  paymentPhone: { type: String, default: '', trim: true },
  cashOnFarm: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Farmhouse', farmhouseSchema);
