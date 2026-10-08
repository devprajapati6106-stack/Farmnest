import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import Toast from '../components/Toast';

export default function OwnerBookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState('');
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('status') || 'pending';

  const load = async () => {
    try {
      const response = await api.get('/bookings/owner');
      setBookings(response.data?.bookings || []);
    } catch (error) {
      setMsg(error.response?.data?.message || 'Unable to load booking requests.');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    load();
  }, []);

  const visible = useMemo(() => {
    if (filter === 'paid') {
      return bookings.filter((item) => item.paymentStatus === 'paid');
    }
    return bookings.filter((item) => item.status === filter);
  }, [bookings, filter]);

  const decision = async (id, action) => {
    try {
      const response = await api.patch(`/bookings/${id}/decision`, { action });
      setMsg(response.data?.message || 'Booking updated.');
      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Booking action failed.');
    }
  };

  return (
    <section className="page-pad section-soft">
      <div className="container">
        <Toast message={msg} />

        <div className="dashboard-hero mb-4">
          <div>
            <span className="section-kicker">booking management</span>
            <h1>Booking requests</h1>
            <p>Review customer details and manage your farmhouse booking pipeline.</p>
          </div>
          <Link to="/owner" className="btn btn-outline-dark rounded-pill px-4">
            <i className="bi bi-arrow-left me-2" />
            Dashboard
          </Link>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-4">
          {[
            ['pending', 'Pending'],
            ['confirmed', 'Confirmed'],
            ['rejected', 'Rejected'],
            ['cancelled', 'Cancelled'],
            ['paid', 'Paid']
          ].map(([value, label]) => (
            <Link
              key={value}
              to={`/owner/booking-requests?status=${value}`}
              className={`btn btn-sm rounded-pill ${
                filter === value ? 'btn-success' : 'btn-outline-dark'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="panel-card">
          <h5 className="mb-1">{filter === 'paid' ? 'Paid bookings' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} bookings`}</h5>
          <p className="text-secondary small mb-4">
            {visible.length} record{visible.length === 1 ? '' : 's'} found.
          </p>

          {visible.length ? (
            <div className="stack-list">
              {visible.map((booking) => (
                <div className="request-card" key={booking._id}>
                  <div className="d-flex justify-content-between gap-3 flex-wrap">
                    <div>
                      <h6 className="fw-bold mb-1">
                        {booking.farmhouse?.title || 'Farmhouse'}
                      </h6>
                      <div className="small text-secondary">
                        <i className="bi bi-person me-1" />
                        {booking.customerName || booking.user?.name || 'Customer'}
                        {' • '}
                        {booking.customerPhone || booking.user?.phone || 'N/A'}
                        {' • '}
                        {booking.customerEmail || booking.user?.email || 'N/A'}
                      </div>
                    </div>
                    <span className={`status-pill ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="small mt-3">
                    <b>Stay:</b>{' '}
                    {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-IN') : '--'}
                    {' → '}
                    {booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-IN') : '--'}
                    {' • '}
                    {booking.nights || 0} nights • {booking.guests || 0} guests
                  </div>

                  <div className="small mt-2">
                    <b>Total:</b> ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                    {' '}
                    <span className="text-secondary">
                      (discount ₹{Number(booking.discountAmount || 0).toLocaleString('en-IN')},
                      service ₹{Number(booking.serviceCharge || 0).toLocaleString('en-IN')},
                      tax ₹{Number(booking.taxAmount || 0).toLocaleString('en-IN')})
                    </span>
                  </div>

                  {booking.specialRequest && (
                    <div className="special-request mt-3">
                      <b><i className="bi bi-chat-left-text me-1" />Special request:</b>
                      <div className="mt-1">{booking.specialRequest}</div>
                    </div>
                  )}

                  <div className="small mt-2">
                    <b>Payment:</b> {booking.paymentStatus || 'unpaid'}
                  </div>

                  {booking.status === 'pending' && (
                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-success rounded-pill"
                        onClick={() => decision(booking._id, 'confirm')}
                      >
                        <i className="bi bi-check-lg me-1" /> Confirm
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill"
                        onClick={() => decision(booking._id, 'reject')}
                      >
                        <i className="bi bi-x-lg me-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x display-6 text-secondary" />
              <h6 className="fw-bold mt-3">No matching bookings</h6>
              <p className="text-secondary small mb-0">New records will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
