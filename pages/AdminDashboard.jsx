import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('approvals');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setLoading(true); const response = await api.get('/admin/overview'); setData(response.data); setError(''); }
    catch (err) { setError(err.response?.data?.message || 'Unable to load admin dashboard.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const farmDecision = async (id, action) => {
    try { const response = await api.patch(`/admin/farmhouses/${id}/decision`, { action }); setMessage(response.data.message); await load(); }
    catch (err) { setMessage(err.response?.data?.message || 'Action failed.'); }
  };
  const userStatus = async (id, status) => {
    try { const response = await api.patch(`/admin/users/${id}/status`, { status }); setMessage(response.data.message); await load(); }
    catch (err) { setMessage(err.response?.data?.message || 'User action failed.'); }
  };
  const deleteReview = async id => {
    if (!window.confirm('Remove this review?')) return;
    try { const response = await api.delete(`/admin/reviews/${id}`); setMessage(response.data.message); await load(); }
    catch (err) { setMessage(err.response?.data?.message || 'Could not remove review.'); }
  };

  if (loading) return <div className="page-loader">Loading admin control room…</div>;
  if (error) return <section className="page-pad"><div className="container"><div className="alert alert-danger"><b>Unable to load dashboard</b><p className="mb-2">{error}</p><button className="btn btn-danger" onClick={load}>Try again</button></div></div></section>;

  const stats = data?.stats || {};
  const pending = data?.farmhouses?.filter(item => item.status === 'pending') || [];
  const bookings = data?.bookings || [];
  const users = data?.users || [];
  const reviews = data?.reviews || [];

  return <section className="page-pad section-soft"><div className="container-fluid px-3 px-md-4">
    <Toast message={message}/>
    <div className="dashboard-hero"><div><span className="section-kicker">operations centre</span><h1>Admin dashboard</h1><p>Approve properties, monitor bookings, manage accounts and keep marketplace quality high.</p></div><button className="btn btn-soft rounded-pill" onClick={load}><i className="bi bi-arrow-clockwise me-1"/> Refresh</button></div>
    <div className="row g-4 mb-4"><Stat title="Users" value={stats.users} icon="bi-people"/><Stat title="Farmhouses" value={stats.farms} icon="bi-buildings"/><Stat title="Pending approvals" value={stats.pendingFarms} icon="bi-hourglass-split"/><Stat title="Bookings" value={stats.bookings} icon="bi-calendar-check"/><Stat title="Paid revenue" value={`₹${Number(stats.revenue || 0).toLocaleString('en-IN')}`} icon="bi-cash-stack"/><Stat title="Reviews" value={stats.reviews} icon="bi-star"/></div>
    <div className="admin-tabs mb-4"><button className={tab === 'approvals' ? 'active' : ''} onClick={() => setTab('approvals')}>Farm approvals <span>{pending.length}</span></button><button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users <span>{users.length}</span></button><button className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>Bookings <span>{bookings.length}</span></button><button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Reviews <span>{reviews.length}</span></button></div>
    {tab === 'approvals' && <FarmApprovals farms={pending} onAction={farmDecision}/>} 
    {tab === 'users' && <Users users={users} onStatus={userStatus}/>} 
    {tab === 'bookings' && <Bookings bookings={bookings}/>} 
    {tab === 'reviews' && <Reviews reviews={reviews} onDelete={deleteReview}/>} 
  </div></section>;
}
function Stat({ title, value, icon }) { return <div className="col-6 col-xl-2"><div className="mini-stat admin-stat"><div className="d-flex justify-content-between"><span>{title}</span><i className={`bi ${icon} text-success`} /></div><strong>{value ?? 0}</strong></div></div>; }
function FarmApprovals({ farms, onAction }) { return <Panel title="Pending farmhouse approvals" subtitle="Review the complete property, owner, pricing and payment details before approval.">{farms.length ? farms.map(f => <div className="admin-list-row admin-approval-row" key={f._id}><img src={f.images?.[0]} alt=""/><div className="flex-grow-1"><b>{f.title}</b><p className="small text-secondary mb-1">Owner: {f.owner?.name} • {f.owner?.email} • {f.owner?.phone || 'No phone'}</p><p className="small mb-1">{f.city} • {f.location} • {f.guests} guests • {f.bedrooms} bedrooms • {f.bathrooms} bathrooms</p><p className="small mb-1">₹{Number(f.pricePerNight).toLocaleString('en-IN')} weekday • ₹{Number(f.weekendPrice || f.pricePerNight).toLocaleString('en-IN')} weekend • {f.discountPercent || 0}% discount • tax {f.taxPercent ?? 5}% • service {f.serviceChargePercent ?? 2}%</p><p className="small mb-1"><b>Amenities:</b> {(f.amenities || []).join(', ') || 'None'}</p><p className="small mb-1"><b>Description:</b> {f.description}</p><p className="small mb-0"><b>Payment:</b> {f.upiId || 'No UPI'} • {f.paymentPhone || 'No number'} • cash on farm: {f.cashOnFarm ? 'Yes' : 'No'}</p></div><div className="d-flex gap-2 flex-wrap"><button className="btn btn-sm btn-success rounded-pill" onClick={() => onAction(f._id, 'approve')}>Approve</button><button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => onAction(f._id, 'reject')}>Reject</button></div></div>) : <Empty icon="bi-check-circle" text="No pending farmhouses."/>}</Panel>; }
function Users({ users, onStatus }) { return <Panel title="Account management" subtitle="Suspend or reactivate marketplace accounts when needed."><div className="table-responsive"><table className="table align-middle"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th className="text-end">Action</th></tr></thead><tbody>{users.map(user => <tr key={user._id}><td><b>{user.name}</b><div className="small text-secondary">{user.email}</div></td><td><span className="status-pill approved">{user.role}</span></td><td><span className={`status-pill ${user.status}`}>{user.status}</span></td><td>{new Date(user.createdAt).toLocaleDateString('en-IN')}</td><td className="text-end">{user.role !== 'admin' && <button className={`btn btn-sm rounded-pill ${user.status === 'suspended' ? 'btn-success' : 'btn-outline-danger'}`} onClick={() => onStatus(user._id, user.status === 'suspended' ? 'active' : 'suspended')}>{user.status === 'suspended' ? 'Activate' : 'Suspend'}</button>}</td></tr>)}</tbody></table></div></Panel>; }
function Bookings({ bookings }) { return <Panel title="Booking monitor" subtitle="A read-only operational view of every booking and payment state."><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Customer</th><th>Farmhouse</th><th>Dates</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead><tbody>{bookings.map(b => <tr key={b._id}><td>{b.user?.name}</td><td>{b.farmhouse?.title}</td><td>{new Date(b.checkIn).toLocaleDateString('en-IN')} → {new Date(b.checkOut).toLocaleDateString('en-IN')}</td><td>₹{Number(b.totalAmount).toLocaleString('en-IN')}</td><td><span className={`status-pill ${b.paymentStatus}`}>{b.paymentStatus}</span></td><td><span className={`status-pill ${b.status}`}>{b.status}</span></td></tr>)}</tbody></table></div></Panel>; }
function Reviews({ reviews, onDelete }) { return <Panel title="Review moderation" subtitle="Remove reviews that violate your marketplace rules.">{reviews.length ? reviews.map(review => <div className="admin-list-row" key={review._id}><div className="avatar">{review.user?.name?.[0] || 'U'}</div><div className="flex-grow-1"><div><b>{review.user?.name}</b> <span className="rating">{'★'.repeat(review.rating)}</span></div><p className="small text-secondary mb-1">{review.farmhouse?.title}</p><p className="mb-0">{review.comment}</p></div><button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => onDelete(review._id)}>Remove</button></div>) : <Empty icon="bi-star" text="No reviews yet."/>}</Panel>; }
function Panel({ title, subtitle, children }) { return <div className="panel-card"><h5 className="mb-1">{title}</h5><p className="text-secondary small mb-4">{subtitle}</p>{children}</div>; }
function Empty({ icon, text }) { return <div className="empty-state text-center py-5"><i className={`bi ${icon} fs-1`} /><p className="text-secondary mt-3 mb-0">{text}</p></div>; }
