import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Toast from '../components/Toast';

const initial = { title: '', description: '', location: '', city: '', pricePerNight: '', weekendPrice: '', discountPercent: 0, guests: 4, bedrooms: 2, bathrooms: 2, amenities: 'Swimming Pool, WiFi, Parking', images: [], upiId: '', paymentPhone: '', cashOnFarm: true, taxPercent: 5, serviceChargePercent: 2 };

export default function NewFarmhouse() {
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const handleImages = async event => {
    const files = Array.from(event.target.files || []);
    if (files.length > 5) return setErr('You can select maximum 5 images.');
    try {
      const images = await Promise.all(files.map(file => fileToDataUrl(file)));
      setForm(current => ({ ...current, images }));
      setErr('');
    } catch (error) { setErr(error.message); }
  };

  const submit = async event => {
    event.preventDefault();
    try {
      const payload = { ...form, pricePerNight: Number(form.pricePerNight), weekendPrice: Number(form.weekendPrice || 0), discountPercent: Number(form.discountPercent || 0), taxPercent: Number(form.taxPercent || 5), serviceChargePercent: Number(form.serviceChargePercent || 2), guests: Number(form.guests), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms), amenities: form.amenities.split(',').map(x => x.trim()).filter(Boolean) };
      const response = await api.post('/farmhouses', payload);
      setMsg(response.data.message);
      setTimeout(() => nav('/owner'), 700);
    } catch (error) { setErr(error.response?.data?.message || 'Could not submit farmhouse.'); }
  };

  return <section className="page-pad section-soft"><div className="container"><div className="form-shell"><div className="form-heading"><span className="section-kicker">host studio</span><h1>Submit a farmhouse</h1><p>Your property stays hidden until an admin approves it.</p></div><Toast message={msg}/>{err && <div className="alert alert-danger">{err}</div>}
    <form onSubmit={submit} className="row g-4">
      <Field label="Farmhouse name" className="col-md-8"><input required className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></Field>
      <Field label="City" className="col-md-4"><input required className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}/></Field>
      <Field label="Location" className="col-md-6"><input required className="form-control" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></Field>
      <Field label="Weekday price / night" className="col-md-3"><input required type="number" min="1" className="form-control" value={form.pricePerNight} onChange={e => setForm({ ...form, pricePerNight: e.target.value })}/></Field>
      <Field label="Weekend price / night" className="col-md-3"><input type="number" min="0" className="form-control" value={form.weekendPrice} onChange={e => setForm({ ...form, weekendPrice: e.target.value })} placeholder="Optional"/></Field>
      <Field label="Discount %" className="col-md-3"><input type="number" min="0" max="90" className="form-control" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })}/></Field>
      <Field label="Tax %" className="col-md-3"><input type="number" min="0" max="50" className="form-control" value={form.taxPercent} onChange={e => setForm({ ...form, taxPercent: e.target.value })}/></Field><Field label="Service charge %" className="col-md-3"><input type="number" min="0" max="30" className="form-control" value={form.serviceChargePercent} onChange={e => setForm({ ...form, serviceChargePercent: e.target.value })}/></Field><Field label="UPI ID for QR" className="col-md-6"><input className="form-control" placeholder="owner@upi" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })}/></Field><Field label="Pay on number" className="col-md-6"><input className="form-control" placeholder="10 digit mobile / UPI number" value={form.paymentPhone} onChange={e => setForm({ ...form, paymentPhone: e.target.value })}/></Field><div className="col-12"><div className="form-check"><input className="form-check-input" type="checkbox" checked={form.cashOnFarm} onChange={e => setForm({ ...form, cashOnFarm: e.target.checked })} id="cashOnFarm"/><label className="form-check-label" htmlFor="cashOnFarm">Allow Cash on Farm</label></div></div><Field label="Max guests" className="col-md-3"><input required type="number" min="1" className="form-control" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}/></Field>
      <Field label="Bedrooms" className="col-md-3"><input required type="number" min="1" className="form-control" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })}/></Field>
      <Field label="Bathrooms" className="col-md-3"><input required type="number" min="1" className="form-control" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })}/></Field>
      <Field label="Amenities (comma separated)" className="col-12"><input className="form-control" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })}/></Field>
      <div className="col-12"><label className="form-label fw-semibold">Farmhouse photos</label><input required={!form.images.length} type="file" accept="image/*" multiple className="form-control" onChange={handleImages}/><small className="text-secondary">Select up to 5 photos from your device. Each image can be up to 5 MB.</small>{form.images.length > 0 && <div className="row g-2 mt-2">{form.images.map((image, index) => <div className="col-6 col-md-3" key={image.slice(-20)}><div className="upload-preview"><img src={image} alt={`Preview ${index + 1}`}/><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== index) })}><i className="bi bi-x" /></button></div></div>)}</div>}</div>
      <Field label="Description" className="col-12"><textarea required className="form-control" rows="5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></Field>
      <div className="col-12 d-flex justify-content-end"><button className="btn btn-primary-custom rounded-pill px-5 py-3">Send for admin approval <i className="bi bi-arrow-up-right ms-1"/></button></div>
    </form></div></div></section>;
}
function Field({ label, className, children }) { return <div className={className}><label className="form-label fw-semibold">{label}</label>{children}</div>; }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { if (file.size > 5 * 1024 * 1024) return reject(new Error(`${file.name} is larger than 5 MB.`)); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error(`Could not read ${file.name}.`)); reader.readAsDataURL(file); }); }
