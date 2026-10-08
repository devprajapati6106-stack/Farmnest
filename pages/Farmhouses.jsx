import { useEffect, useState } from 'react';
import api from '../api';
import FarmhouseCard from '../components/FarmhouseCard';

export default function Farmhouses() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', city: '', minPrice: '', maxPrice: '', guests: '' });
  const [sort, setSort] = useState('newest');

  const load = () => {
    setLoading(true);
    api.get('/farmhouses', { params: { ...filters, sort } })
      .then(response => setFarms(response.data.farmhouses))
      .catch(() => setFarms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [sort]);

  return <section className="page-pad"><div className="container">
    <div className="discover-head"><div><span className="section-kicker">the collection</span><h1>Find your kind of quiet.</h1><p>Explore approved farmhouses ready to receive booking requests.</p></div><div className="sort-wrap"><i className="bi bi-sliders"/><select className="form-select" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="rating">Top rated</option><option value="priceLow">Price: low</option><option value="priceHigh">Price: high</option></select></div></div>
    <div className="search-box mini row g-2 mb-5">
      <div className="col-lg-4"><div className="input-wrap"><i className="bi bi-search"/><input className="form-control" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Farmhouse, city or location"/></div></div>
      <div className="col-6 col-lg-2"><input className="form-control" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} placeholder="City"/></div>
      <div className="col-6 col-lg-2"><input type="number" className="form-control" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} placeholder="Min ₹"/></div>
      <div className="col-6 col-lg-2"><input type="number" className="form-control" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} placeholder="Max ₹"/></div>
      <div className="col-6 col-lg-1"><input type="number" min="1" className="form-control" value={filters.guests} onChange={e => setFilters({ ...filters, guests: e.target.value })} placeholder="Guests"/></div>
      <div className="col-lg-1"><button className="btn btn-dark w-100 h-100 rounded-3" onClick={load} title="Search"><i className="bi bi-search"/></button></div>
    </div>
    {loading ? <div className="page-loader">Loading stays…</div> : <div className="row g-4">{farms.map(f => <div className="col-md-6 col-xl-4" key={f._id}><FarmhouseCard farmhouse={f}/></div>)}</div>}
    {!loading && !farms.length && <div className="empty-state text-center py-5"><i className="bi bi-search fs-1"/><h4 className="mt-3">No approved stays found</h4><p className="text-secondary">Try another city, price range or guest count.</p></div>}
  </div></section>;
}
