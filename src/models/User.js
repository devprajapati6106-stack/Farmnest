import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Farmhouse' }]
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
