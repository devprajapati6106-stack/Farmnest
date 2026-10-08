import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';
import ChatBox from '../components/ChatBox';

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ chart: [] });
  const [msg, setMsg] = useState('');
  const [payOpen, setPayOpen] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);

  const load = async () => {
    const [bookingResponse, statsResponse] = await Promise.all([
      api.get('/bookings/mine'),
      api.get('/dashboard/user'),
    ]);

    setBookings(bookingResponse.data.bookings || []);
    setStats(statsResponse.data.stats || {});
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const cancel = async (id) => {
    try {
      const response = await api.patch(`/bookings/${id}/cancel`);
      setMsg(response.data.message);
      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Unable to cancel');
    }
  };

  const pay = async (booking, method) => {
    try {
      const response = await api.post(`/bookings/${booking._id}/pay`, {
        paymentMethod: method,
      });
      setMsg(response.data.message);
      setPayOpen(null);
      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Payment failed');
    }
  };

  const toggleChat = (bookingId) => {
    setPayOpen(null);
    setChatOpen((current) => (current === bookingId ? null : bookingId));
  };

  return (
    <section className="page-pad section-soft">
      <div className="container">
        <Toast message={msg} />

        <div className="dashboard-hero">
          <div>
            <span className="section-kicker">your escape board</span>
            <h1>Bookings & payments</h1>
            <p>
              Track detailed requests, owner confirmations, payment and stay
              spending in one place.
            </p>
          </div>
          <div className="dash-orb">
            <i className="bi bi-calendar-heart" />
          </div>
        </div>

        <div className="row g-4 mb-4">
          <Mini title="Requests" value={bookings.length} />
          <Mini
            title="Awaiting owner"
            value={bookings.filter((booking) => booking.status === 'pending').length}
          />
          <Mini
            title="Confirmed"
            value={bookings.filter((booking) => booking.status === 'confirmed').length}
          />
          <Mini
            title="Paid"
            value={bookings.filter((booking) => booking.paymentStatus === 'paid').length}
          />
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="panel-card">
              <h5>My spending chart</h5>
              <p className="small text-secondary">Paid booking total by month.</p>
              <SimpleChart data={stats.chart || []} valueKey="spent" />
            </div>
          </div>

          <div className="col-lg-5">
            <div className="insight-card h-100">
              <span>Total paid</span>
              <strong>₹{Number(stats.spent || 0).toLocaleString('en-IN')}</strong>
              <small>Calculated from completed booking payments</small>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-4 shadow-sm p-3 p-lg-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0">My stays</h4>
            <span className="small text-secondary">
              Owner approval is required before payment
            </span>
          </div>

          {bookings.length ? (
            bookings.map((booking) => {
              const isChatOpen = chatOpen === booking._id;
              const isPaymentOpen = payOpen === booking._id;

              return (
                <div className="booking-card-row" key={booking._id}>
                  <img
                    src={booking.farmhouse?.images?.[0]}
                    alt={booking.farmhouse?.title || 'Farmhouse'}
                  />

                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1">
                      {booking.farmhouse?.title || 'Farmhouse'}
                    </h6>

                    <div className="small text-secondary">
                      {new Date(booking.checkIn).toLocaleDateString('en-IN')}
                      {' → '}
                      {new Date(booking.checkOut).toLocaleDateString('en-IN')}
                      {' • '}
                      {booking.nights || 0} nights
                      {' • '}
                      {booking.guests || 0} guests
                    </div>

                    <div className="small mt-1">
                      {booking.customerName} • {booking.customerPhone}
                    </div>

                    <div className="mt-2">
                      <Status status={booking.status} />
                      <span
                        className={`status-pill ${
                          booking.paymentStatus === 'paid' ? 'paid' : 'unpaid'
                        }`}
                      >
                        payment: {booking.paymentStatus}
                      </span>
                    </div>

                    <div className="mt-2 fw-semibold">
                      ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}{' '}
                      <span className="small text-secondary">
                        incl. discount, service charge & tax
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-end">
                    {booking.status === 'confirmed' &&
                      booking.paymentStatus === 'unpaid' && (
                        <button
                          type="button"
                          className="btn btn-primary-custom btn-sm rounded-pill px-3"
                          onClick={() => {
                            setChatOpen(null);
                            setPayOpen(isPaymentOpen ? null : booking._id);
                          }}
                        >
                          <i className="bi bi-qr-code me-1" /> Pay
                        </button>
                      )}

                    {['pending', 'confirmed'].includes(booking.status) && (
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-sm rounded-pill px-3"
                        onClick={() => cancel(booking._id)}
                      >
                        Cancel
                      </button>
                    )}

                    {['pending', 'confirmed', 'rejected'].includes(booking.status) && (
                      <button
                        type="button"
                        className="btn btn-primary-custom btn-sm rounded-pill px-3"
                        onClick={() => toggleChat(booking._id)}
                      >
                        <i className="bi bi-chat-dots me-1" /> Chat
                      </button>
                    )}

                    {isPaymentOpen && (
                      <PaymentOptions booking={booking} onPay={pay} />
                    )}
                  </div>

                  {isChatOpen && (
                    <div className="w-100 mt-3">
                      <ChatBox farmhouseId={booking.farmhouse?._id} compact />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-state text-center py-5">
              <i className="bi bi-calendar2-x fs-1" />
              <h5 className="mt-3">No booking requests yet</h5>
              <p className="text-secondary">
                Discover a farmhouse and send your first request.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PaymentOptions({ booking, onPay }) {
  const farm = booking.farmhouse || {};
  const qr = farm.upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        `upi://pay?pa=${farm.upiId}&pn=${farm.title || 'FarmNest'}&am=${booking.totalAmount || 0}&cu=INR`
      )}`
    : '';

  return (
    <div className="payment-popover card shadow p-3">
      <b>Choose payment</b>

      {qr && <img className="payment-qr" src={qr} alt="UPI QR code" />}

      <div className="small text-secondary mb-2">
        Amount: ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
      </div>

      {farm.upiId && (
        <button
          type="button"
          className="btn btn-success btn-sm w-100 mb-2"
          onClick={() => onPay(booking, 'upi_qr')}
        >
          Pay by QR / UPI
        </button>
      )}

      {farm.paymentPhone && (
        <>
          <a
            className="btn btn-outline-dark btn-sm w-100 mb-2"
            href={`tel:${farm.paymentPhone}`}
          >
            <i className="bi bi-telephone me-1" />
            Pay on number: {farm.paymentPhone}
          </a>

          <button
            type="button"
            className="btn btn-outline-success btn-sm w-100 mb-2"
            onClick={() => onPay(booking, 'pay_number')}
          >
            I paid on this number
          </button>
        </>
      )}

      {farm.cashOnFarm && (
        <button
          type="button"
          className="btn btn-soft btn-sm w-100"
          onClick={() => onPay(booking, 'cash_on_farm')}
        >
          Cash on farm
        </button>
      )}
    </div>
  );
}

function SimpleChart({ data, valueKey }) {
  const max = Math.max(
    ...data.map((item) => Number(item[valueKey] || 0)),
    1
  );

  return (
    <div className="simple-chart">
      {data.map((item) => (
        <div className="chart-column" key={item.key}>
          <div className="chart-bar-wrap">
            <div
              className="chart-bar"
              style={{
                height: `${Math.max(
                  6,
                  (Number(item[valueKey] || 0) / max) * 100
                )}%`,
              }}
              title={`₹${Number(item[valueKey] || 0).toLocaleString('en-IN')}`}
            />
          </div>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function Mini({ title, value }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="mini-stat">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Status({ status }) {
  return <span className={`status-pill ${status}`}>{status}</span>;
}
