import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const dashboard = user?.role === 'admin' ? '/admin' : user?.role === 'owner' ? '/owner' : '/dashboard';

  useEffect(() => {
    if (!user) return;
    api.get('/users/notifications').then(response => setUnread(response.data.unread || 0)).catch(() => {});
  }, [user]);

  return <nav className="navbar navbar-expand-lg navbar-light fixed-top glass-nav"><div className="container py-2">
    <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/"><span className="brand-mark"><i className="bi bi-buildings-fill" /></span><span>Farm<span className="brand-accent">Nest</span></span></Link>
    <button className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#mainNav"><span className="navbar-toggler-icon" /></button>
    <div className="collapse navbar-collapse" id="mainNav">
      <ul className="navbar-nav mx-auto gap-lg-3"><li><NavLink className="nav-link" to="/">Home</NavLink></li><li><NavLink className="nav-link" to="/farmhouses">Discover</NavLink></li><li><a className="nav-link" href="/#why-us">Why us</a></li><li><a className="nav-link" href="/#contact">Contact</a></li></ul>
      <div className="d-flex gap-2 align-items-center flex-wrap">
        {user ? <>
          {user.role === 'user' && <Link className="icon-nav-btn" to="/wishlist" title="Wishlist"><i className="bi bi-heart" /></Link>}
          <Link className="icon-nav-btn position-relative" to="/notifications" title="Notifications"><i className="bi bi-bell" />{unread > 0 && <span className="notification-count">{unread > 9 ? '9+' : unread}</span>}</Link>
          <Link className="btn btn-soft rounded-pill px-3" to={dashboard}><i className="bi bi-grid-1x2 me-1" /> Dashboard</Link>
          <Link className="icon-nav-btn" to="/profile" title="Profile"><i className="bi bi-person-circle" /></Link>
          <button className="btn btn-dark rounded-pill px-3" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </> : <><Link className="btn btn-soft rounded-pill px-3" to="/login">Login</Link><Link className="btn btn-primary-custom rounded-pill px-4" to="/register">Get started</Link></>}
      </div>
    </div>
  </div></nav>;
}
