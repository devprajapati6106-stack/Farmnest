import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import ChatBox from './ChatBox';
import api from '../api';

export default function FarmhouseCard({ farmhouse }) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const toggleFavorite = async () => {
    if (!user) return;
    try {
      const response = await api.patch(`/users/wishlist/${farmhouse._id}`);
      setFavorite(Boolean(response.data.favorite));
    } catch (_) {
      // Keep the card usable even if wishlist request fails.
    }
  };

  const location = [farmhouse.location, farmhouse.city]
    .filter(Boolean)
    .join(', ');

  const priceCandidates = [
    farmhouse.pricePerNight,
    farmhouse.pricePerDay,
    farmhouse.price,
    farmhouse.weekdayPrice,
    farmhouse.weekendPrice,
  ];
  const displayPrice = priceCandidates
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0) || 5000;

  const directionQuery = location || farmhouse.title || 'farmhouse';
  const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionQuery)}`;

  return (
    <article className="card farmhouse-card h-100 border-0">
      <div className="farm-img-wrap position-relative">
        <img
          src={farmhouse.images?.[0]}
          className="farmhouse-image"
          alt={farmhouse.title || 'Farmhouse'}
        />

        <span className="image-chip">
          <i className="bi bi-star-fill me-1" />
          {Number(farmhouse.rating || 0).toFixed(1)}
        </span>

        {user?.role === 'user' && (
          <button
            type="button"
            className={`favorite-btn ${favorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            title="Save farmhouse"
          >
            <i className={`bi ${favorite ? 'bi-heart-fill' : 'bi-heart'}`} />
          </button>
        )}

        <span className="price-badge">
          {displayPrice > 0 ? (
            <>₹{displayPrice.toLocaleString('en-IN')} <small>/ night</small></>
          ) : (
            <>Price not set</>
          )}
        </span>
      </div>

      <div className="card-body p-4 d-flex flex-column">
        <div className="small text-success fw-semibold mb-2">
          <i className="bi bi-geo-alt-fill me-1" />
          {location || 'Location available on details page'}
        </div>

        <h5 className="fw-bold mb-2">{farmhouse.title}</h5>

        <p className="text-secondary small line-clamp-2">
          {farmhouse.description}
        </p>

        <div className="property-meta mb-4">
          <span><i className="bi bi-people" /> {farmhouse.guests}</span>
          <span><i className="bi bi-door-open" /> {farmhouse.bedrooms}</span>
          <span><i className="bi bi-droplet" /> {farmhouse.bathrooms}</span>
        </div>

        <div className="d-flex gap-2 mt-auto">
          <Link
            className="btn btn-farmhouse-view rounded-pill flex-grow-1"
            to={`/farmhouses/${farmhouse._id}`}
          >
            View details <i className="bi bi-arrow-up-right ms-1" />
          </Link>

          {user?.role === 'user' && (
            <button
              type="button"
              className={`btn btn-card-chat rounded-pill ${chatOpen ? 'active' : ''}`}
              onClick={() => setChatOpen((open) => !open)}
              title="Chat with owner"
              aria-label={`Chat with owner of ${farmhouse.title}`}
            >
              <i className="bi bi-chat-dots" />
            </button>
          )}

          <a
            className="btn btn-direction rounded-pill"
            target="_blank"
            rel="noopener noreferrer"
            href={directionUrl}
            title="Get directions"
            aria-label={`Get directions to ${farmhouse.title}`}
          >
            <i className="bi bi-sign-turn-right" />
          </a>
        </div>

        {chatOpen && user?.role === 'user' && (
          <div className="mt-3">
            <ChatBox farmhouseId={farmhouse._id} compact />
          </div>
        )}
      </div>
    </article>
  );
}
