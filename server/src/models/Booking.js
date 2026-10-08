import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    farmhouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmhouse',
      required: true
    },

    customerName: {
      type: String,
      required: true
    },

    customerEmail: {
      type: String,
      required: true
    },

    customerPhone: {
      type: String,
      required: true
    },

    checkIn: {
      type: Date,
      required: true
    },

    checkOut: {
      type: Date,
      required: true
    },

    guests: {
      type: Number,
      required: true,
      min: 1
    },

    nights: {
      type: Number,
      required: true,
      min: 1
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    serviceCharge: {
      type: Number,
      default: 0,
      min: 0
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'rejected',
        'cancelled'
      ],
      default: 'pending'
    },

    /*
     * Online payment:
     * paid immediately after successful payment.
     *
     * Cash on Farm:
     * remains unpaid until check-in date.
     */
    paymentStatus: {
      type: String,
      enum: [
        'unpaid',
        'paid',
        'refunded'
      ],
      default: 'unpaid'
    },

    paymentMethod: {
      type: String,
      enum: [
        '',
        'upi_qr',
        'pay_number',
        'cash_on_farm',
        'Demo Card'
      ],
      default: ''
    },

    paymentReference: {
      type: String,
      default: ''
    },

    /*
     * This field stores the exact date/time
     * when the cash payment was considered received.
     */
    paymentCollectedAt: {
      type: Date,
      default: null
    },

    specialRequest: {
      type: String,
      default: ''
    },

    ownerNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Booking', bookingSchema);