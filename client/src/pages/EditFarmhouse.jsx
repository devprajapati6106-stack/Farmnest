import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

export default function EditFarmhouse() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [blockedDate, setBlockedDate] = useState('');

  useEffect(() => {
    api.get('/farmhouses/owner/mine').then(response => {
      const farmhouse = response.data.farmhouses.find(item => item._id === id);
      if (!farmhouse) return setErr('Farmhouse not found.');
      setForm({ ...farmhouse, blockedDates: farmhouse.blockedDates || [], amenities: (farmhouse.amenities || []).join(', '), images: farmhouse.images || [], weekendPrice: farmhouse.weekendPrice || '', discountPercent: farmhouse.discountPercent || 0, taxPercent: farmhouse.taxPercent ?? 5, serviceChargePercent: farmhouse.serviceChargePercent ?? 2, upiId: farmhouse.upiId || '', paymentPhone: farmhouse.paymentPhone || '', cashOnFarm: farmhouse.cashOnFarm ?? true });
    }).catch(error => setErr(error.response?.data?.message || 'Unable to load.'));
  }, [id]);

  const handleImages = async event => {
    const files = Array.from(event.target.files || []);
    if (files.length + form.images.length > 5) return setErr('Maximum 5 images are allowed.');
    try {
      const images = await Promise.all(files.map(file => fileToDataUrl(file)));
      setForm(current => ({ ...current, images: [...current.images, ...images] }));
      setErr('');
    } catch (error) { setErr(error.message); }
  };

  const addBlockedDate = () => {
    if (!blockedDate) return;
    if (!(form.blockedDates || []).some(date => String(date).slice(0, 10) === blockedDate)) {
      setForm({ ...form, blockedDates: [...(form.blockedDates || []), blockedDate] });
    }
    setBlockedDate('');
  };

  const saveBlockedDates = async () => {
    try {
      const response = await api.put(`/farmhouses/${id}/availability`, { blockedDates: form.blockedDates || [] });
      setForm({ ...form, blockedDates: response.data.farmhouse.blockedDates || [] });
      setErr('Availability updated successfully.');
    } catch (error) { setErr(error.response?.data?.message || 'Could not update availability.'); }
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.put(`/farmhouses/${id}`, { ...form, amenities: form.amenities.split(',').map(x => x.trim()).filter(Boolean), pricePerNight: Number(form.pricePerNight), weekendPrice: Number(form.weekendPrice || 0), discountPercent: Number(form.discountPercent || 0), taxPercent: Number(form.taxPercent ?? 5), serviceChargePercent: Number(form.serviceChargePercent ?? 2), guests: Number(form.guests), bedrooms: Number(form.bedrooms), bathrooms: Number(form.bathrooms) });
      nav('/owner');
    } catch (error) { setErr(error.response?.data?.message || 'Update failed.'); }
    finally { setBusy(false); }
  };

  if (!form) return <div className="page-loader">{err || 'Loading…'}</div>;

  return <section className="page-pad section-soft"><div className="container"><div className="form-shell">
    <span className="section-kicker">property editor</span><h1>Edit farmhouse</h1><p className="text-secondary">Saving property details sends the listing back to admin review.</p>{err && <div className="alert alert-info">{err}</div>}
    <form onSubmit={submit} className="row g-4">
      <Field c="col-md-8" l="Name"><input required className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></Field>
      <Field c="col-md-4" l="City"><input required className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}/></Field>
      <Field c="col-md-6" l="Location"><input required className="form-control" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></Field>
      <Field c="col-md-3" l="Weekday price"><input required type="number" min="1" className="form-control" value={form.pricePerNight} onChange={e => setForm({ ...form, pricePerNight: e.target.value })}/></Field>
      <Field c="col-md-3" l="Weekend price"><input type="number" min="0" className="form-control" value={form.weekendPrice} onChange={e => setForm({ ...form, weekendPrice: e.target.value })}/></Field>
      <Field c="col-md-3" l="Discount %"><input type="number" min="0" max="90" className="form-control" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })}/></Field>
      <Field c="col-md-3" l="Tax %"><input type="number" min="0" max="50" className="form-control" value={form.taxPercent} onChange={e => setForm({ ...form, taxPercent: e.target.value })}/></Field><Field c="col-md-3" l="Service charge %"><input type="number" min="0" max="30" className="form-control" value={form.serviceChargePercent} onChange={e => setForm({ ...form, serviceChargePercent: e.target.value })}/></Field><Field c="col-md-6" l="UPI ID for QR"><input className="form-control" value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })}/></Field><Field c="col-md-6" l="Pay on number"><input className="form-control" value={form.paymentPhone} onChange={e => setForm({ ...form, paymentPhone: e.target.value })}/></Field><div className="col-12"><div className="form-check"><input className="form-check-input" type="checkbox" checked={form.cashOnFarm} onChange={e => setForm({ ...form, cashOnFarm: e.target.checked })} id="cashOnFarmEdit"/><label className="form-check-label" htmlFor="cashOnFarmEdit">Allow Cash on Farm</label></div></div><Field c="col-md-3" l="Guests"><input type="number" min="1" className="form-control" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}/></Field>
      <Field c="col-md-3" l="Bedrooms"><input type="number" min="1" className="form-control" value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: e.target.value })}/></Field>
      <Field c="col-md-3" l="Bathrooms"><input type="number" min="1" className="form-control" value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: e.target.value })}/></Field>
      <Field c="col-12" l="Amenities"><input className="form-control" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })}/></Field>

      <div className="col-12"><div className="availability-box"><div className="d-flex justify-content-between align-items-center gap-3 mb-3"><div><label className="form-label fw-semibold mb-1">Blocked dates</label><div className="small text-secondary">Block personal or maintenance days so customers cannot request them.</div></div><span className="status-pill inactive">{form.blockedDates?.length || 0} blocked</span></div><div className="d-flex gap-2"><input type="date" className="form-control" value={blockedDate} onChange={e => setBlockedDate(e.target.value)} min={new Date().toISOString().slice(0, 10)}/><button type="button" className="btn btn-dark rounded-pill px-3" onClick={addBlockedDate}>Block</button></div>{form.blockedDates?.length > 0 && <div className="d-flex flex-wrap gap-2 mt-3">{form.blockedDates.map((date, index) => <span className="date-chip" key={`${date}-${index}`}>{new Date(date).toLocaleDateString('en-IN')}<button type="button" onClick={() => setForm({ ...form, blockedDates: form.blockedDates.filter((_, i) => i !== index) })}>×</button></span>)}</div>}<button type="button" className="btn btn-soft btn-sm rounded-pill mt-3" onClick={saveBlockedDates}><i className="bi bi-calendar-check me-1"/> Save availability</button></div></div>

      <div className="col-12"><label className="form-label fw-semibold">Property photos</label><input type="file" accept="image/*" multiple className="form-control" onChange={handleImages}/><div className="row g-2 mt-2">{form.images.map((image, index) => <div className="col-6 col-md-3" key={`${image.slice(-18)}-${index}`}><div className="upload-preview"><img src={image} alt=""/><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== index) })}><i className="bi bi-x"/></button></div></div>)}</div></div>
      <Field c="col-12" l="Description"><textarea required className="form-control" rows="5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></Field>
      <div className="col-12 d-flex gap-2 justify-content-end"><button type="button" className="btn btn-soft rounded-pill px-4" onClick={() => nav('/owner')}>Cancel</button><button disabled={busy} className="btn btn-primary-custom rounded-pill px-4">{busy ? 'Saving…' : 'Submit changes for approval'}</button></div>
    </form>
  </div></div></section>;
}
function Field({ c, l, children }) { return <div className={c}><label className="form-label fw-semibold">{l}</label>{children}</div>; }
function fileToDataUrl(file) { return new Promise((resolve, reject) => { if (file.size > 5 * 1024 * 1024) return reject(new Error(`${file.name} is larger than 5 MB.`)); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error(`Could not read ${file.name}.`)); reader.readAsDataURL(file); }); }
