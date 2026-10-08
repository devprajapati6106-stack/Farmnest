import Booking from '../models/Booking.js';
import Farmhouse from '../models/Farmhouse.js';
import User from '../models/User.js';
import { notify } from '../utils/notify.js';

function dayCount(start, end) {
  return Math.ceil(
    (end.getTime() - start.getTime()) / 86400000
  );
}

function calculatePrice(farmhouse, start, end) {
  const weekendRate =
    farmhouse.weekendPrice > 0
      ? farmhouse.weekendPrice
      : farmhouse.pricePerNight;

  let subtotal = 0;

  for (
    let cursor = new Date(start);
    cursor < end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const day = cursor.getDay();

    if (day === 0 || day === 6) {
      subtotal += weekendRate;
    } else {
      subtotal += farmhouse.pricePerNight;
    }
  }

  const discountAmount = Math.round(
    subtotal *
      (Number(farmhouse.discountPercent || 0) / 100)
  );

  const discounted =
    subtotal - discountAmount;

  const serviceCharge = Math.round(
    discounted *
      (Number(
        farmhouse.serviceChargePercent ?? 2
      ) / 100)
  );

  const taxAmount = Math.round(
    (discounted + serviceCharge) *
      (Number(
        farmhouse.taxPercent ?? 5
      ) / 100)
  );

  const totalAmount =
    discounted +
    serviceCharge +
    taxAmount;

  return {
    subtotal,
    discountAmount,
    serviceCharge,
    taxAmount,
    totalAmount
  };
}

/*
 * Cash on Farm:
 *
 * Payment is considered received only when
 * the booking check-in date arrives.
 *
 * Example:
 * Check-in = 10 October
 * Before 10 October -> unpaid
 * On/after 10 October -> paid
 */
export async function collectDueCashPayments() {
  const now = new Date();

  const dueCashBookings =
    await Booking.find({
      status: 'confirmed',
      paymentMethod: 'cash_on_farm',
      paymentStatus: 'unpaid',
      checkIn: {
        $lte: now
      }
    });

  if (!dueCashBookings.length) {
    return [];
  }

  const collectedIds =
    dueCashBookings.map(
      (booking) => booking._id
    );

  await Booking.updateMany(
    {
      _id: {
        $in: collectedIds
      }
    },
    {
      $set: {
        paymentStatus: 'paid',
        paymentCollectedAt: now
      }
    }
  );

  return collectedIds;
}

export async function calculateBooking(req, res) {
  try {
    const {
      farmhouseId,
      checkIn,
      checkOut
    } = req.body;

    const farmhouse =
      await Farmhouse.findOne({
        _id: farmhouseId,
        status: 'approved'
      });

    if (!farmhouse) {
      return res.status(404).json({
        message:
          'Farmhouse is not available.'
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const nights = dayCount(
      start,
      end
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      nights <= 0
    ) {
      return res.status(400).json({
        message:
          'Please provide valid dates.'
      });
    }

    res.json({
      nights,
      pricing: calculatePrice(
        farmhouse,
        start,
        end
      )
    });
  } catch (error) {
    res.status(400).json({
      message:
        'Could not calculate booking.',
      error: error.message
    });
  }
}

export async function createBooking(req, res) {
  try {
    const {
      farmhouseId,
      checkIn,
      checkOut,
      guests,
      specialRequest = ''
    } = req.body;

    const user =
      await User.findById(
        req.user._id
      );

    const farmhouse =
      await Farmhouse.findOne({
        _id: farmhouseId,
        status: 'approved'
      });

    if (!farmhouse) {
      return res.status(404).json({
        message:
          'Farmhouse is not available.'
      });
    }

    if (
      !user?.name ||
      !user?.email ||
      !user?.phone
    ) {
      return res.status(400).json({
        message:
          'Please complete your name, email and mobile number in Profile before booking.'
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    const nights = dayCount(
      start,
      end
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      nights <= 0
    ) {
      return res.status(400).json({
        message:
          'Please provide valid dates.'
      });
    }

    if (
      start <
      new Date(
        new Date().toDateString()
      )
    ) {
      return res.status(400).json({
        message:
          'Check-in cannot be in the past.'
      });
    }

    if (
      farmhouse.blockedDates?.some(
        (date) => {
          const blockedDate =
            new Date(date);

          return (
            blockedDate >= start &&
            blockedDate < end
          );
        }
      )
    ) {
      return res.status(409).json({
        message:
          'Selected dates include owner-blocked dates.'
      });
    }

    if (
      Number(guests) >
      farmhouse.guests
    ) {
      return res.status(400).json({
        message:
          `Maximum guests: ${farmhouse.guests}.`
      });
    }

    const conflict =
      await Booking.findOne({
        farmhouse: farmhouseId,

        status: {
          $in: [
            'pending',
            'confirmed'
          ]
        },

        checkIn: {
          $lt: end
        },

        checkOut: {
          $gt: start
        }
      });

    if (conflict) {
      return res.status(409).json({
        message:
          'These dates already have a booking request.'
      });
    }

    const pricing =
      calculatePrice(
        farmhouse,
        start,
        end
      );

    const booking =
      await Booking.create({
        user: req.user._id,

        farmhouse: farmhouseId,

        customerName:
          user.name,

        customerEmail:
          user.email,

        customerPhone:
          user.phone,

        checkIn: start,

        checkOut: end,

        guests:
          Number(guests),

        nights,

        ...pricing,

        specialRequest,

        status: 'pending',

        paymentStatus:
          'unpaid'
      });

    const populated =
      await booking.populate(
        'farmhouse',
        'title location images pricePerNight owner upiId paymentPhone cashOnFarm'
      );

    await notify(
      farmhouse.owner,
      'New detailed booking request',
      `${user.name} requested ${farmhouse.title} for ${nights} night(s). Open the booking to see contact details and special request.`,
      'booking'
    );

    res.status(201).json({
      message:
        'Detailed booking request sent to the owner.',

      booking: populated
    });
  } catch (error) {
    res.status(400).json({
      message:
        'Booking failed.',

      error:
        error.message
    });
  }
}

export async function myBookings(
  req,
  res
) {
  /*
   * Before returning bookings,
   * automatically collect due Cash on Farm payments.
   */
  await collectDueCashPayments();

  const bookings =
    await Booking.find({
      user: req.user._id
    })
      .populate(
        'farmhouse',
        'title location images pricePerNight owner upiId paymentPhone cashOnFarm'
      )
      .sort({
        createdAt: -1
      });

  res.json({
    bookings
  });
}

export async function cancelBooking(
  req,
  res
) {
  const booking =
    await Booking.findOneAndUpdate(
      {
        _id: req.params.id,

        user: req.user._id,

        status: {
          $in: [
            'pending',
            'confirmed'
          ]
        }
      },

      {
        status: 'cancelled'
      },

      {
        new: true
      }
    );

  if (!booking) {
    return res.status(404).json({
      message:
        'Booking not found.'
    });
  }

  const full =
    await booking.populate(
      'farmhouse',
      'title owner'
    );

  await notify(
    full.farmhouse.owner,
    'Booking cancelled',
    `A customer cancelled the booking for ${full.farmhouse.title}.`,
    'booking'
  );

  res.json({
    message:
      'Booking cancelled successfully.',

    booking
  });
}

export async function ownerBookings(
  req,
  res
) {
  /*
   * Automatically mark due Cash on Farm
   * bookings as collected.
   */
  await collectDueCashPayments();

  const farmhouses =
    await Farmhouse.find({
      owner: req.user._id
    }).select('_id title');

  const ids =
    farmhouses.map(
      (item) => item._id
    );

  const bookings =
    await Booking.find({
      farmhouse: {
        $in: ids
      }
    })
      .populate(
        'user',
        'name email phone'
      )
      .populate(
        'farmhouse',
        'title location pricePerNight'
      )
      .sort({
        createdAt: -1
      });

  res.json({
    bookings
  });
}

export async function ownerDecision(
  req,
  res
) {
  const {
    action,
    ownerNote = ''
  } = req.body;

  if (
    ![
      'confirm',
      'reject'
    ].includes(action)
  ) {
    return res.status(400).json({
      message:
        'Invalid action.'
    });
  }

  const booking =
    await Booking.findById(
      req.params.id
    ).populate(
      'farmhouse'
    );

  if (
    !booking ||
    String(
      booking.farmhouse.owner
    ) !==
      String(req.user._id)
  ) {
    return res.status(404).json({
      message:
        'Booking not found.'
    });
  }

  if (
    booking.status !==
    'pending'
  ) {
    return res.status(400).json({
      message:
        'This booking is no longer pending.'
    });
  }

  if (action === 'confirm') {
    const conflict =
      await Booking.findOne({
        _id: {
          $ne: booking._id
        },

        farmhouse:
          booking.farmhouse._id,

        status:
          'confirmed',

        checkIn: {
          $lt: booking.checkOut
        },

        checkOut: {
          $gt: booking.checkIn
        }
      });

    if (conflict) {
      return res.status(409).json({
        message:
          'Another confirmed booking occupies these dates.'
      });
    }

    booking.status =
      'confirmed';
  } else {
    booking.status =
      'rejected';
  }

  booking.ownerNote =
    ownerNote;

  await booking.save();

  await notify(
    booking.user,

    action === 'confirm'
      ? 'Booking confirmed'
      : 'Booking rejected',

    action === 'confirm'
      ? 'Your owner-confirmed booking is ready for payment.'
      : 'The owner rejected your booking request.',

    'booking'
  );

  res.json({
    message:
      action === 'confirm'
        ? 'Booking confirmed. Customer can now pay.'
        : 'Booking rejected.',

    booking
  });
}

export async function payBooking(
  req,
  res
) {
  try {
    const {
      paymentMethod = 'Demo Card',
      paymentReference = ''
    } = req.body;

    const booking =
      await Booking.findOne({
        _id: req.params.id,

        user: req.user._id,

        status: 'confirmed',

        paymentStatus: 'unpaid'
      });

    if (!booking) {
      return res.status(400).json({
        message:
          'Only owner-confirmed unpaid bookings can be paid.'
      });
    }

    const validMethods = [
      'upi_qr',
      'pay_number',
      'cash_on_farm',
      'Demo Card'
    ];

    if (
      !validMethods.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        message:
          'Invalid payment method.'
      });
    }

    /*
     * IMPORTANT:
     *
     * Cash on Farm is NOT paid immediately.
     *
     * It will become paid automatically
     * on the booking check-in date.
     */
    if (
      paymentMethod ===
      'cash_on_farm'
    ) {
      booking.paymentMethod =
        'cash_on_farm';

      booking.paymentStatus =
        'unpaid';

      booking.paymentReference =
        paymentReference ||
        `CASH-${booking._id}`;

      booking.paymentCollectedAt =
        null;

      await booking.save();

      const farm =
        await Farmhouse.findById(
          booking.farmhouse
        ).select(
          'title owner'
        );

      await notify(
        farm.owner,

        'Cash on Farm selected',

        `Customer selected Cash on Farm for ${farm.title}. ₹${booking.totalAmount} will be counted as received on the check-in date.`,

        'payment'
      );

      await notify(
        booking.user,

        'Cash on Farm selected',

        `Your booking is confirmed. ₹${booking.totalAmount} will be counted as paid on your check-in date.`,

        'payment'
      );

      return res.json({
        message:
          'Cash on Farm selected. Payment will be counted on the check-in date.',

        booking
      });
    }

    /*
     * Online / other payment methods:
     * payment is recorded immediately.
     */
    booking.paymentStatus =
      'paid';

    booking.paymentMethod =
      paymentMethod;

    booking.paymentReference =
      paymentReference ||
      `FARMNEST-${Date.now()}`;

    booking.paymentCollectedAt =
      new Date();

    await booking.save();

    const farm =
      await Farmhouse.findById(
        booking.farmhouse
      ).select(
        'title owner'
      );

    await notify(
      farm.owner,

      'Payment received',

      `Payment was completed for ${farm.title} via ${paymentMethod.replaceAll('_', ' ')}.`,

      'payment'
    );

    await notify(
      booking.user,

      'Payment successful',

      `Your payment for ${farm.title} was recorded successfully.`,

      'payment'
    );

    res.json({
      message:
        `Payment recorded using ${paymentMethod.replaceAll('_', ' ')}.`,

      booking
    });
  } catch (error) {
    res.status(400).json({
      message:
        'Payment failed.',

      error:
        error.message
    });
  }
}