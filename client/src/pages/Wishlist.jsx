import { useEffect, useState } from 'react';
import api from '../api';
import FarmhouseCard from '../components/FarmhouseCard';

export default function Wishlist() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/users/wishlist').then(r => setFavorites(r.data.favorites)).finally(() => setLoading(false)); }, []);
  return <section className="page-pad section-soft"><div className="container"><div className="discover-head"><div><span className="section-kicker">saved stays</span><h1>Your wishlist.</h1><p>Keep your favourite farmhouses ready for the next weekend.</p></div><div className="dash-orb"><i className="bi bi-heart-fill" /></div></div>{loading ? <div className="page-loader">Loading wishlist…</div> : favorites.length ? <div className="row g-4">{favorites.map(f => <div className="col-md-6 col-xl-4" key={f._id}><FarmhouseCard farmhouse={f} /></div>)}</div> : <div className="empty-state text-center py-5"><i className="bi bi-heart fs-1" /><h4 className="mt-3">Your wishlist is empty</h4><p className="text-secondary">Tap the heart on a farmhouse you want to revisit.</p></div>}</div></section>;
}
