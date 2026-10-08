import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { const user = await login(form.email, form.password); navigate(location.state?.from?.pathname || (user.role === 'owner' ? '/owner' : user.role === 'admin' ? '/admin' : '/dashboard')); }
    catch (err) { setError(err.response?.data?.message || 'Login failed.'); }
    finally { setBusy(false); }
  };

  return <AuthLayout title="Welcome back" subtitle="Login to manage your bookings and farm stays."><form onSubmit={submit}>{error && <div className="alert alert-danger">{error}</div>}<label className="form-label">Email Address</label><input required type="email" className="form-control mb-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /><label className="form-label">Password</label><input required type="password" className="form-control mb-4" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /><button disabled={busy} className="btn btn-success w-100 rounded-pill py-3">{busy ? 'Logging in...' : 'Login'}</button><p className="text-center text-secondary small mt-4 mb-0">Don't have an account? <Link className="text-success fw-semibold" to="/register">Create one</Link></p></form></AuthLayout>;
}

function AuthLayout({ title, subtitle, children }) { return <section className="auth-page"><div className="auth-overlay" /><div className="container position-relative"><div className="row justify-content-center"><div className="col-md-6 col-lg-5"><div className="auth-card bg-white rounded-4 shadow-lg p-4 p-lg-5"><Link to="/" className="text-decoration-none text-dark d-flex justify-content-center align-items-center gap-2 fw-bold fs-5"><span className="brand-mark"><i className="bi bi-house-heart-fill" /></span>FarmHouse<span className="brand-accent">Rent</span></Link><h2 className="fw-bold text-center mt-4 mb-2">{title}</h2><p className="text-secondary text-center mb-4">{subtitle}</p>{children}</div></div></div></div></section>; }
