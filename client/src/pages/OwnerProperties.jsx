import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import Toast from '../components/Toast';

export default function OwnerProperties() {
  const [farms, setFarms] = useState([]);
  const [msg, setMsg] = useState('');
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('status') || 'all';

  const load = async () => {
    try {
      const response = await api.get('/farmhouses/owner/mine');
      setFarms(response.data?.farmhouses || []);
    } catch (error) {
      setMsg(error.response?.data?.message || 'Unable to load properties.');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    load();
  }, []);

  const visible = useMemo(() => {
    return farms.filter((farm) => {
      if (filter === 'active') return farm.status === 'approved' && farm.isActive !== false;
      if (filter === 'inactive') return farm.status === 'inactive' || (farm.status === 'approved' && farm.isActive === false);
      return filter === 'all' || farm.status === filter;
    });
  }, [farms, filter]);

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    if (!window.confirm(nextStatus === 'active' ? 'Activate this farmhouse?' : 'Deactivate this farmhouse?')) return;

    try {
      const response = await api.patch(`/farmhouses/${id}/status`, { status: nextStatus });
      setMsg(response.data?.message || 'Status updated.');
      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Could not update status.');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this farmhouse permanently from the database?')) return;

    try {
      const response = await api.delete(`/farmhouses/${id}`);
      setMsg(response.data?.message || 'Farmhouse deleted.');
      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <section className="page-pad section-soft">
      <div className="container">
        <Toast message={msg} />

        <div className="dashboard-hero mb-4">
          <div>
            <span className="section-kicker">property management</span>
            <h1>My farmhouses</h1>
            <p>Manage active, inactive and approval-pending properties.</p>
          </div>
          <Link to="/owner/new" className="btn btn-primary-custom rounded-pill px-4">
            <i className="bi bi-plus-lg me-2" /> Add farmhouse
          </Link>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-4">
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['inactive', 'Inactive'],
            ['pending', 'Pending'],
            ['rejected', 'Rejected']
          ].map(([value, label]) => (
            <Link
              key={value}
              to={`/owner/properties${value === 'all' ? '' : `?status=${value}`}`}
              className={`btn btn-sm rounded-pill ${filter === value ? 'btn-success' : 'btn-outline-dark'}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="panel-card">
          <h5 className="mb-1">Property list</h5>
          <p className="text-secondary small mb-4">
            {visible.length} property{visible.length === 1 ? '' : 'ies'} found.
          </p>

          {visible.length ? (
            <div className="stack-list">
              {visible.map((farm) => (
                <div className="property-row" key={farm._id}>
                  <img src={farm.images?.[0] || '/placeholder-farmhouse.jpg'} alt={farm.title || 'Farmhouse'} />
                  <div className="flex-grow-1">
                    <b>{farm.title}</b>
                    <div className="small text-secondary">
                      {farm.city || farm.location || 'Location unavailable'} • ₹{Number(farm.pricePerNight || 0).toLocaleString('en-IN')} / night
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      <span className={`status-pill ${farm.status}`}>{farm.status}</span>
                      {farm.status === 'approved' && (
                        <span className={`status-pill ${farm.isActive === false ? 'inactive' : 'paid'}`}>
                          {farm.isActive === false ? 'inactive' : 'active'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <Link className="btn btn-sm btn-outline-dark rounded-pill" to={`/owner/edit/${farm._id}`}>
                      <i className="bi bi-pencil me-1" /> Edit
                    </Link>
                    {farm.status !== 'pending' && farm.status !== 'rejected' && (
                      <button
                        type="button"
                        className={`btn btn-sm rounded-pill ${farm.status === 'inactive' ? 'btn-outline-success' : 'btn-outline-warning'}`}
                        onClick={() => toggleStatus(farm._id, farm.status)}
                      >
                        <i className={`bi ${farm.status === 'inactive' ? 'bi-toggle-on' : 'bi-toggle-off'} me-1`} />
                        {farm.status === 'inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                    )}
                    <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => del(farm._id)}>
                      <i className="bi bi-trash me-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-buildings display-6 text-secondary" />
              <h6 className="fw-bold mt-3">No properties found</h6>
              <p className="text-secondary small mb-0">Try another property filter.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
