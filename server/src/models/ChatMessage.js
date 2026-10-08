import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  farmhouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmhouse', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

export default mongoose.model('ChatMessage', chatMessageSchema);
