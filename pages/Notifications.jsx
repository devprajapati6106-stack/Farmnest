import { useEffect, useState } from 'react';
import api from '../api';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => api.get('/users/notifications').then(r => setItems(r.data.notifications)).finally(() => setLoading(false));
  useEffect(() => { load(); api.patch('/users/notifications/read').catch(() => {}); }, []);
  return <section className="page-pad section-soft"><div className="container"><div className="dashboard-hero"><div><span className="section-kicker">stay informed</span><h1>Notifications</h1><p>Booking, payment, farmhouse and account updates live here.</p></div><div className="dash-orb"><i className="bi bi-bell" /></div></div><div className="panel-card"><div className="stack-list">{loading ? <div className="page-loader">Loading notifications…</div> : items.length ? items.map(item => <div className={`notification-row ${item.read ? '' : 'unread'}`} key={item._id}><div className="notification-icon"><i className={`bi ${iconFor(item.type)}`} /></div><div className="flex-grow-1"><b>{item.title}</b><p className="small text-secondary mb-1">{item.message}</p><small className="text-secondary">{new Date(item.createdAt).toLocaleString('en-IN')}</small></div></div>) : <div className="empty-state text-center py-5"><i className="bi bi-bell-slash fs-1" /><h5 className="mt-3">You're all caught up</h5><p className="text-secondary mb-0">New activity will appear here.</p></div>}</div></div></div></section>;
}
function iconFor(type) { return type === 'booking' ? 'bi-calendar-check' : type === 'payment' ? 'bi-credit-card' : type === 'review' ? 'bi-star' : type === 'farmhouse' ? 'bi-house-heart' : 'bi-info-circle'; }
