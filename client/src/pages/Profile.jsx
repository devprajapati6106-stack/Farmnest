import { useEffect, useState } from 'react';
import api from '../api';
import Toast from '../components/Toast';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data.user);
      setForm({ name: response.data.user.name || '', phone: response.data.user.phone || '', avatar: response.data.user.avatar || '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load profile.');
    }
  };

  useEffect(() => { load(); }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put('/users/profile', form);
      setUser(response.data.user);
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed.');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put('/users/password', passwords);
      setMessage(response.data.message);
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed.');
    }
  };

  if (!user) return <div className="page-loader">Loading profile…</div>;

  return (
    <section className="page-pad section-soft">
      <div className="container">
        <Toast message={message} />
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="dashboard-hero">
          <div><span className="section-kicker">your account</span><h1>Profile & security</h1><p>Keep your FarmNest account details and password up to date.</p></div>
          <div className="dash-orb"><i className="bi bi-person-gear" /></div>
        </div>
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="panel-card">
              <h5>Personal details</h5>
              <form onSubmit={saveProfile} className="row g-3">
                <Field label="Full name" className="col-md-6"><input required className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Phone" className="col-md-6"><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Avatar image URL (optional)" className="col-12"><input className="form-control" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="https://..." /></Field>
                <div className="col-12"><label className="form-label">Email</label><input disabled className="form-control" value={user.email} /></div>
                <div className="col-12"><button className="btn btn-primary-custom rounded-pill px-4">Save profile</button></div>
              </form>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="panel-card">
              <h5>Change password</h5>
              <form onSubmit={changePassword} className="vstack gap-3">
                <input required type="password" className="form-control" placeholder="Current password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} />
                <input required minLength="6" type="password" className="form-control" placeholder="New password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} />
                <button className="btn btn-dark rounded-pill">Update password</button>
              </form>
              <div className="soft-note mt-4"><i className="bi bi-shield-check me-2" />Never share your password with anyone.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, className, children }) { return <div className={className}><label className="form-label fw-semibold">{label}</label>{children}</div>; }
