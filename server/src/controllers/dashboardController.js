import Booking from '../models/Booking.js';
import Farmhouse from '../models/Farmhouse.js';
import {
  collectDueCashPayments
} from './bookingController.js';

function monthKey(date) {
  return new Date(
    date
  ).toLocaleString(
    'en-US',
    {
      month: 'short'
    }
  );
}

/*
 * Returns the date that should be used
 * for earning/spending calculations.
 *
 * Cash on Farm:
 *     Check-in date
 *
 * Other payment methods:
 *     Payment collection date
 */
function getFinancialDate(
  booking
) {
  if (
    booking.paymentMethod ===
      'cash_on_farm' &&
    booking.paymentCollectedAt
  ) {
    return booking.paymentCollectedAt;
  }

  if (booking.paymentCollectedAt) {
    return booking.paymentCollectedAt;
  }

  return booking.updatedAt;
}

/*
 * Check whether a booking should be included
 * in financial totals.
 */
function isFinancialBooking(
  booking
) {
  if (
    booking.paymentStatus !==
    'paid'
  ) {
    return false;
  }

  if (
    booking.status ===
      'rejected' ||
    booking.status ===
      'cancelled'
  ) {
    return false;
  }

  return true;
}

export async function ownerDashboard(
  req,
  res
) {
  try {
    /*
     * FIRST:
     * Collect Cash on Farm payments whose
     * check-in date has arrived.
     */
    await collectDueCashPayments();

    const properties =
      await Farmhouse.find({
        owner: req.user._id
      }).sort({
        createdAt: -1
      });

    const ids =
      properties.map(
        (item) => item._id
      );

    const bookings =
      await Booking.find({
        farmhouse: {
          $in: ids
        }
      })
        .populate(
          'farmhouse',
          'title'
        )
        .populate(
          'user',
          'name email phone'
        )
        .sort({
          createdAt: -1
        });

    const pendingFarms =
      properties.filter(
        (item) =>
          item.status ===
          'pending'
      ).length;

    const activeProperties =
      properties.filter(
        (item) =>
          item.status ===
            'approved' &&
          item.isActive !== false
      ).length;

    const inactiveProperties =
      properties.filter(
        (item) =>
          item.status ===
            'inactive' ||
          (
            item.status ===
              'approved' &&
            item.isActive === false
          )
      ).length;

    const pendingBookings =
      bookings.filter(
        (item) =>
          item.status ===
          'pending'
      ).length;

    const confirmedBookings =
      bookings.filter(
        (item) =>
          item.status ===
          'confirmed'
      ).length;

    const cancelledBookings =
      bookings.filter(
        (item) =>
          item.status ===
          'cancelled'
      ).length;

    /*
     * Only REALIZED payments are counted.
     *
     * Cash on Farm gets included only after
     * collectDueCashPayments() has marked it paid.
     */
    const paidBookings =
      bookings.filter(
        isFinancialBooking
      );

    const revenue =
      paidBookings.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.totalAmount ||
              0
          ),
        0
      );

    /*
     * Last 6 months earning chart.
     */
    const months =
      Array.from(
        {
          length: 6
        },
        (
          _,
          index
        ) => {
          const d =
            new Date();

          d.setMonth(
            d.getMonth() -
              (5 - index)
          );

          return {
            key: `${d.getFullYear()}-${d.getMonth()}`,

            label:
              d.toLocaleString(
                'en-US',
                {
                  month:
                    'short'
                }
              ),

            revenue: 0
          };
        }
      );

    paidBookings.forEach(
      (item) => {
        const d =
          new Date(
            getFinancialDate(
              item
            )
          );

        const key =
          `${d.getFullYear()}-${d.getMonth()}`;

        const row =
          months.find(
            (month) =>
              month.key ===
              key
          );

        if (row) {
          row.revenue +=
            Number(
              item.totalAmount ||
                0
            );
        }
      }
    );

    res.json({
      stats: {
        properties:
          properties.length,

        activeProperties,

        inactiveProperties,

        pendingFarms,

        bookings:
          bookings.length,

        pendingBookings,

        confirmedBookings,

        cancelledBookings,

        paid:
          paidBookings.length,

        revenue,

        chart:
          months
      },

      properties,

      bookings
    });
  } catch (error) {
    console.error(
      'ownerDashboard:',
      error
    );

    res.status(500).json({
      message:
        'Unable to load owner dashboard.',

      error:
        error.message
    });
  }
}

export async function userDashboard(
  req,
  res
) {
  try {
    /*
     * FIRST:
     * Automatically collect due Cash on Farm
     * payments.
     */
    await collectDueCashPayments();

    const bookings =
      await Booking.find({
        user: req.user._id
      });

    /*
     * Only realized payments are counted.
     */
    const paid =
      bookings.filter(
        isFinancialBooking
      );

    const spent =
      paid.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.totalAmount ||
              0
          ),
        0
      );

    /*
     * Last 6 months spending chart.
     */
    const months =
      Array.from(
        {
          length: 6
        },
        (
          _,
          index
        ) => {
          const d =
            new Date();

          d.setMonth(
            d.getMonth() -
              (5 - index)
          );

          return {
            key:
              `${d.getFullYear()}-${d.getMonth()}`,

            label:
              d.toLocaleString(
                'en-US',
                {
                  month:
                    'short'
                }
              ),

            spent: 0
          };
        }
      );

    paid.forEach(
      (item) => {
        const d =
          new Date(
            getFinancialDate(
              item
            )
          );

        const key =
          `${d.getFullYear()}-${d.getMonth()}`;

        const row =
          months.find(
            (month) =>
              month.key ===
              key
          );

        if (row) {
          row.spent +=
            Number(
              item.totalAmount ||
                0
            );
        }
      }
    );

    res.json({
      stats: {
        bookings:
          bookings.length,

        paid:
          paid.length,

        spent,

        chart:
          months
      }
    });
  } catch (error) {
    console.error(
      'userDashboard:',
      error
    );

    res.status(500).json({
      message:
        'Unable to load user dashboard.',

      error:
        error.message
    });
  }
}