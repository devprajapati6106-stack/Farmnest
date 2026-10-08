import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Toast from '../components/Toast';
import ChatBox from '../components/ChatBox';

export default function OwnerDashboard() {
  const [farms, setFarms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [msg, setMsg] = useState('');
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    chart: [],
  });

  const load = async () => {
    try {
      const [
        farmsResponse,
        bookingsResponse,
        dashboardResponse,
        inquiriesResponse,
      ] = await Promise.all([
        api.get('/farmhouses/owner/mine'),
        api.get('/bookings/owner'),
        api.get('/dashboard/owner'),
        api.get('/chat/owner/inbox'),
      ]);

      setFarms(farmsResponse.data?.farmhouses || []);
      setBookings(bookingsResponse.data?.bookings || []);
      setAnalytics(dashboardResponse.data?.stats || {});
      setInquiries(inquiriesResponse.data?.conversations || []);
    } catch (error) {
      console.error('Owner dashboard error:', error);

      setMsg(
        error.response?.data?.message ||
          'Unable to load owner dashboard.'
      );
    }
  };

  useLayoutEffect(() => {
    // Always start the Owner Dashboard at the top. This runs before paint,
    // preventing the browser from restoring the previous page position.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    load();
  }, []);

  const decision = async (id, action) => {
    try {
      const response = await api.patch(
        `/bookings/${id}/decision`,
        { action }
      );

      setMsg(response.data?.message || 'Booking updated.');
      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          'Booking action failed.'
      );
    }
  };

  const del = async (id) => {
    if (
      !window.confirm(
        'Delete this farmhouse permanently? The farmhouse record will be removed from the database.'
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/farmhouses/${id}`);

      setMsg(
        response.data?.message ||
          'Farmhouse deleted successfully.'
      );

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          'Delete failed.'
      );
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'inactive'
      ? 'active'
      : 'inactive';

    const confirmed = window.confirm(
      nextStatus === 'active'
        ? 'Make this farmhouse active and visible to customers?'
        : 'Make this farmhouse inactive? Customers will not be able to book it.'
    );

    if (!confirmed) return;

    try {
      const response = await api.patch(
        `/farmhouses/${id}/status`,
        { status: nextStatus }
      );

      setMsg(
        response.data?.message ||
          `Farmhouse ${nextStatus} successfully.`
      );

      await load();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
          'Could not update farmhouse status.'
      );
    }
  };

  const paidCount = useMemo(
    () =>
      bookings.filter(
        (item) => item.paymentStatus === 'paid'
      ).length,
    [bookings]
  );

  const pendingBookings = useMemo(
    () =>
      bookings.filter(
        (item) => item.status === 'pending'
      ),
    [bookings]
  );

  const confirmedBookings = useMemo(
    () =>
      bookings.filter(
        (item) => item.status === 'confirmed'
      ),
    [bookings]
  );

  const activeProperties = useMemo(
    () =>
      farms.filter(
        (farm) =>
          farm.status === 'approved' &&
          farm.isActive !== false
      ),
    [farms]
  );

  return (
    <section className="page-pad section-soft">
      <div className="container">

        <Toast message={msg} />

        {/* =========================
            DASHBOARD HEADER
        ========================== */}
        <div className="dashboard-hero">
          <div>
            <span className="section-kicker">
              host control room
            </span>

            <h1>Owner dashboard</h1>

            <p>
              Manage properties, availability, guest requests
              and your earning pipeline.
            </p>
          </div>

          <Link
            to="/owner/new"
            className="btn btn-primary-custom rounded-pill px-4"
          >
            <i className="bi bi-plus-lg me-2" />
            Add farmhouse
          </Link>
        </div>

        {/* =========================
            MAIN STATISTICS
        ========================== */}
        <div className="row g-4 mb-4">

          <Mini
            t="Properties"
            v={farms.length}
            icon="bi-buildings"
            to="/owner/properties"
          />

          <Mini
            t="Pending farms"
            v={analytics.pendingFarms ?? farms.filter((farm) => farm.status === 'pending').length}
            icon="bi-hourglass-split"
            to="/owner/properties?status=pending"
          />

          <Mini
            t="Booking requests"
            v={analytics.pendingBookings ?? pendingBookings.length}
            icon="bi-calendar2-event"
            to="/owner/booking-requests?status=pending"
          />

          <Mini
            t="Confirmed stays"
            v={analytics.confirmedBookings ?? confirmedBookings.length}
            icon="bi-check-circle"
            to="/owner/booking-requests?status=confirmed"
          />

        </div>

        <div className="row g-4 mb-4">
          <Mini
            t="Active properties"
            v={analytics.activeProperties ?? activeProperties.length}
            icon="bi-toggle-on"
            to="/owner/properties?status=active"
          />

          <Mini
            t="Inactive properties"
            v={analytics.inactiveProperties ?? farms.filter((farm) => farm.status === 'inactive').length}
            icon="bi-toggle-off"
            to="/owner/properties?status=inactive"
          />

          <Mini
            t="Cancelled bookings"
            v={analytics.cancelledBookings ?? bookings.filter((item) => item.status === 'cancelled').length}
            icon="bi-x-circle"
            to="/owner/booking-requests?status=cancelled"
          />

          <Mini
            t="Paid bookings"
            v={analytics.paid ?? paidCount}
            icon="bi-credit-card"
            to="/owner/booking-requests?status=paid"
          />
        </div>

        {/* =========================
            REVENUE INSIGHTS
        ========================== */}
        <div className="row g-4 mb-4">

          <div className="col-md-4">
            <div className="insight-card">
              <span>Paid bookings</span>

              <strong>{paidCount}</strong>

              <small>
                Completed customer payments
              </small>
            </div>
          </div>

          <div className="col-md-4">
            <div className="insight-card">
              <span>Revenue</span>

              <strong>
                ₹
                {Number(
                  analytics.revenue || 0
                ).toLocaleString('en-IN')}
              </strong>

              <small>
                From paid bookings
              </small>
            </div>
          </div>

          <div className="col-md-4">
            <div className="insight-card">
              <span>Guest activity</span>

              <strong>
                {bookings.length}
              </strong>

              <small>
                Total booking requests received
              </small>
            </div>
          </div>

        </div>

        {/* =========================
            EARNINGS CHART
        ========================== */}
        <div className="row g-4 mb-4">

          <div className="col-lg-8">
            <div className="panel-card">

              <h5 className="mb-1">
                Earnings chart
              </h5>

              <p className="small text-secondary">
                Paid revenue from the last six months.
              </p>

              <SimpleChart
                data={analytics.chart || []}
              />

            </div>
          </div>

          <div className="col-lg-4">
            <div className="insight-card h-100">

              <span>Total earnings</span>

              <strong>
                ₹
                {Number(
                  analytics.revenue || 0
                ).toLocaleString('en-IN')}
              </strong>

              <small>
                Only paid bookings are counted.
              </small>

            </div>
          </div>

        </div>

        {/* =========================
            BOOKING REQUESTS
        ========================== */}
        <div className="row g-4">

          <div className="col-lg-7">

            <Panel
              title="Booking requests"
              subtitle="Review customer details before confirming a stay."
            >

              <div className="stack-list">

                {bookings.length > 0 ? (

                  bookings.map((booking) => (

                    <div
                      className="request-card"
                      key={booking._id}
                    >

                      <div className="flex-grow-1">

                        {/* FARMHOUSE TITLE */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">

                          <h6 className="fw-bold mb-0">
                            {booking.farmhouse?.title ||
                              'Farmhouse'}
                          </h6>

                          <span
                            className={`status-pill ${
                              booking.status
                            }`}
                          >
                            {booking.status}
                          </span>

                        </div>

                        {/* CUSTOMER BASIC INFO */}
                        <p className="small text-secondary mb-1 mt-2">

                          <i className="bi bi-person me-1" />

                          {booking.user?.name ||
                            booking.customerName ||
                            'Customer'}

                          {' • '}

                          {booking.customerPhone ||
                            booking.user?.phone ||
                            booking.customerEmail ||
                            booking.user?.email ||
                            'Contact unavailable'}

                        </p>

                        {/* DATE / NIGHT / GUEST */}
                        <p className="small mb-1">

                          <i className="bi bi-calendar3 me-1" />

                          {booking.checkIn
                            ? new Date(
                                booking.checkIn
                              ).toLocaleDateString(
                                'en-IN'
                              )
                            : '--'}

                          {' → '}

                          {booking.checkOut
                            ? new Date(
                                booking.checkOut
                              ).toLocaleDateString(
                                'en-IN'
                              )
                            : '--'}

                          {' • '}

                          {booking.nights || 0} nights

                          {' • '}

                          {booking.guests || 0} guests

                        </p>

                        {/* FULL CUSTOMER DETAILS */}
                        <div className="small mb-2">

                          <b>Customer:</b>{' '}

                          {booking.customerName ||
                            booking.user?.name ||
                            'N/A'}

                          {' • '}

                          {booking.customerPhone ||
                            booking.user?.phone ||
                            'N/A'}

                          {' • '}

                          {booking.customerEmail ||
                            booking.user?.email ||
                            'N/A'}

                        </div>

                        {/* PRICE BREAKDOWN */}
                        <div className="small mb-2">

                          <b>Total:</b>{' '}

                          ₹
                          {Number(
                            booking.totalAmount || 0
                          ).toLocaleString('en-IN')}

                          <span className="text-secondary">

                            {' '}
                            (
                            discount ₹
                            {Number(
                              booking.discountAmount || 0
                            ).toLocaleString('en-IN')}

                            , service ₹
                            {Number(
                              booking.serviceCharge || 0
                            ).toLocaleString('en-IN')}

                            , tax ₹
                            {Number(
                              booking.taxAmount || 0
                            ).toLocaleString('en-IN')}

                            )

                          </span>

                        </div>

                        {/* PAYMENT STATUS */}
                        <div className="small mb-2">

                          <b>Payment:</b>{' '}

                          <span
                            className={
                              booking.paymentStatus ===
                              'paid'
                                ? 'text-success fw-semibold'
                                : 'text-secondary'
                            }
                          >
                            {booking.paymentStatus ||
                              'pending'}
                          </span>

                        </div>

                        {/* SPECIAL REQUEST */}
                        {booking.specialRequest && (

                          <div className="special-request mb-3">

                            <b>
                              <i className="bi bi-chat-left-text me-1" />
                              Special request:
                            </b>

                            <div className="mt-1">
                              {booking.specialRequest}
                            </div>

                          </div>

                        )}

                        {/* OWNER NOTE */}
                        {booking.ownerNote && (

                          <small className="text-secondary d-block mb-2">

                            <b>Note:</b>{' '}
                            {booking.ownerNote}

                          </small>

                        )}

                        {/* BOOKING CHAT */}
                        {booking.farmhouse?._id &&
                          booking.user?._id && (

                            <div className="mt-3">

                              <div className="small fw-semibold mb-2 text-success">
                                <i className="bi bi-chat-dots me-1" />
                                Booking chat
                              </div>

                              <ChatBox
                                farmhouseId={
                                  booking.farmhouse._id
                                }
                                receiverId={
                                  booking.user._id
                                }
                                compact
                              />

                            </div>

                          )}

                      </div>

                      {/* CONFIRM / REJECT */}
                      {booking.status === 'pending' && (

                        <div className="d-flex gap-2 flex-wrap">

                          <button
                            type="button"
                            className="btn btn-sm btn-success rounded-pill"
                            onClick={() =>
                              decision(
                                booking._id,
                                'confirm'
                              )
                            }
                          >
                            <i className="bi bi-check-lg me-1" />
                            Confirm
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() =>
                              decision(
                                booking._id,
                                'reject'
                              )
                            }
                          >
                            <i className="bi bi-x-lg me-1" />
                            Reject
                          </button>

                        </div>

                      )}

                    </div>

                  ))

                ) : (

                  <div className="text-center py-4">

                    <i className="bi bi-calendar-x display-6 text-secondary" />

                    <h6 className="fw-bold mt-3 mb-1">
                      No booking requests yet
                    </h6>

                    <p className="text-secondary small mb-0">
                      New customer booking requests
                      will appear here.
                    </p>

                  </div>

                )}

              </div>

            </Panel>

          </div>

          {/* =========================
              MY FARMHOUSES
          ========================== */}
          <div className="col-lg-5">

            <Panel
              title="My farmhouses"
              subtitle="Manage your listed properties."
            >

              <div className="stack-list">

                {farms.length > 0 ? (

                  farms.map((farm) => (

                    <div
                      className="property-row"
                      key={farm._id}
                    >

                      <img
                        src={
                          farm.images?.[0] ||
                          '/placeholder-farmhouse.jpg'
                        }
                        alt={farm.title || 'Farmhouse'}
                      />

                      <div className="flex-grow-1">

                        <b>
                          {farm.title}
                        </b>

                        <div className="small text-secondary">

                          ₹
                          {Number(
                            farm.pricePerNight ||
                              farm.weekdayPrice ||
                              farm.price ||
                              0
                          ).toLocaleString('en-IN')}

                          {' / night'}

                        </div>

                        <div className="d-flex gap-2 flex-wrap mt-1">

                          <span
                            className={`status-pill ${
                              farm.status
                            }`}
                          >
                            {farm.status}
                          </span>

                          {farm.discountPercent > 0 && (

                            <span className="status-pill paid">
                              {farm.discountPercent}% offer
                            </span>

                          )}

                        </div>

                      </div>

                      <div className="d-flex flex-column gap-2">

                        <Link
                          className="btn btn-sm btn-outline-dark rounded-pill"
                          to={`/owner/edit/${farm._id}`}
                        >
                          <i className="bi bi-pencil me-1" />
                          Edit
                        </Link>

                        {farm.status !== 'pending' && farm.status !== 'rejected' && (
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill ${
                              farm.status === 'inactive'
                                ? 'btn-outline-success'
                                : 'btn-outline-warning'
                            }`}
                            onClick={() =>
                              toggleStatus(farm._id, farm.status)
                            }
                          >
                            <i
                              className={`bi ${
                                farm.status === 'inactive'
                                  ? 'bi-toggle-on'
                                  : 'bi-toggle-off'
                              } me-1`}
                            />
                            {farm.status === 'inactive'
                              ? 'Activate'
                              : 'Deactivate'}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger rounded-pill"
                          onClick={() => del(farm._id)}
                        >
                          <i className="bi bi-trash me-1" />
                          Delete
                        </button>

                      </div>

                    </div>

                  ))

                ) : (

                  <div className="text-center py-4">

                    <i className="bi bi-buildings display-6 text-secondary" />

                    <h6 className="fw-bold mt-3 mb-1">
                      No farmhouses yet
                    </h6>

                    <p className="text-secondary small mb-3">
                      Add your first farmhouse to start
                      receiving bookings.
                    </p>

                    <Link
                      to="/owner/new"
                      className="btn btn-primary-custom rounded-pill"
                    >
                      <i className="bi bi-plus-lg me-1" />
                      Add farmhouse
                    </Link>

                  </div>

                )}

              </div>

            </Panel>

          </div>

        </div>

        {/* =========================
            FARMHOUSE INQUIRIES
        ========================== */}
        <div className="row g-4 mt-1">

          <div className="col-12">

            <Panel
              title="Farmhouse Inquiries"
              subtitle="Customers can chat with you before sending a booking request."
            >

              {inquiries.length > 0 ? (

                <div className="stack-list">

                  {inquiries.map((conversation) => {

                    const farmhouse =
                      conversation.farmhouse;

                    const customer =
                      conversation.user;

                    const latestMessage =
                      conversation.latestMessage;

                    return (
                      <div
                        className="request-card"
                        key={`${farmhouse?._id}-${customer?._id}`}
                      >

                        <div className="flex-grow-1">

                          {/* INQUIRY HEADER */}
                          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">

                            <div>

                              <h6 className="fw-bold mb-1">

                                <i className="bi bi-chat-dots-fill text-success me-2" />

                                {farmhouse?.title ||
                                  'Farmhouse'}

                              </h6>

                              <div className="small text-secondary">

                                <i className="bi bi-person me-1" />

                                Customer:{' '}

                                <b>
                                  {customer?.name ||
                                    'Customer'}
                                </b>

                                {customer?.email && (
                                  <>
                                    {' • '}
                                    {customer.email}
                                  </>
                                )}

                              </div>

                            </div>

                            <span className="status-pill pending">
                              Pre-booking inquiry
                            </span>

                          </div>

                          {/* LATEST MESSAGE */}
                          {latestMessage && (

                            <div className="special-request mt-3">

                              <b>
                                <i className="bi bi-chat-left-text me-1" />
                                Latest message:
                              </b>

                              <div className="mt-1">
                                {latestMessage.message}
                              </div>

                            </div>

                          )}

                          {/* MESSAGE TIME */}
                          {latestMessage?.createdAt && (

                            <small className="text-secondary d-block mt-2">

                              <i className="bi bi-clock me-1" />

                              {new Date(
                                latestMessage.createdAt
                              ).toLocaleString('en-IN')}

                            </small>

                          )}

                          {/* PRE-BOOKING CHAT */}
                          {farmhouse?._id &&
                            customer?._id && (

                              <div className="mt-3">

                                <div className="small fw-semibold mb-2 text-success">

                                  <i className="bi bi-chat-dots me-1" />

                                  Customer inquiry chat

                                </div>

                                <ChatBox
                                  farmhouseId={
                                    farmhouse._id
                                  }
                                  receiverId={
                                    customer._id
                                  }
                                  compact
                                />

                              </div>

                            )}

                        </div>

                      </div>
                    );
                  })}

                </div>

              ) : (

                <div className="text-center py-5">

                  <i className="bi bi-chat-square-text display-5 text-secondary" />

                  <h6 className="fw-bold mt-3 mb-1">
                    No farmhouse inquiries yet
                  </h6>

                  <p className="text-secondary small mb-0">
                    Customers who click the Chat button
                    on your farmhouse cards will appear here.
                  </p>

                </div>

              )}

            </Panel>

          </div>

        </div>

      </div>
    </section>
  );
}


/* =========================================
   MINI STAT CARD
========================================= */

function Mini({ t, v, icon, to }) {
  const content = (
    <>
      <div className="d-flex justify-content-between">
        <span>{t}</span>
        <i className={`bi ${icon} text-success`} />
      </div>
      <strong>{v}</strong>
      <span className="small text-success d-block mt-1">
        View details <i className="bi bi-arrow-right" />
      </span>
    </>
  );

  return (
    <div className="col-6 col-lg-3">
      <Link
        to={to}
        className="mini-stat text-decoration-none d-block"
        aria-label={`Open ${t}`}
      >
        {content}
      </Link>
    </div>
  );
}

/* =========================================
   PANEL
========================================= */

function Panel({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="panel-card">

      <h5 className="mb-1">
        {title}
      </h5>

      {subtitle && (
        <p className="text-secondary small mb-4">
          {subtitle}
        </p>
      )}

      {children}

    </div>
  );
}


/* =========================================
   EARNINGS CHART
========================================= */

function SimpleChart({ data = [] }) {
  const safeData = Array.isArray(data)
    ? data
    : [];

  const max = Math.max(
    ...safeData.map((item) =>
      Number(item.revenue || 0)
    ),
    1
  );

  if (!safeData.length) {
    return (
      <div className="text-center py-4">

        <i className="bi bi-bar-chart display-6 text-secondary" />

        <p className="text-secondary small mt-2 mb-0">
          Earnings data will appear here
          after paid bookings.
        </p>

      </div>
    );
  }

  return (
    <div className="simple-chart">

      {safeData.map((item) => {

        const revenue =
          Number(item.revenue || 0);

        const height = Math.max(
          6,
          (revenue / max) * 100
        );

        return (
          <div
            className="chart-column"
            key={item.key || item.label}
          >

            <div className="chart-bar-wrap">

              <div
                className="chart-bar"
                style={{
                  height: `${height}%`,
                }}
                title={`₹${revenue.toLocaleString(
                  'en-IN'
                )}`}
              />

            </div>

            <small>
              {item.label}
            </small>

          </div>
        );
      })}

    </div>
  );
}