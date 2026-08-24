import { Link } from 'react-router-dom'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function EventCard({ event }) {
  const seatsLeft = event.capacity - event.registered_count
  return (
    <Link to={`/events/${event.id}`} className="event-card">
      {event.banner_url && (
        <img src={event.banner_url} alt={`${event.title} banner`} className="event-banner" />
      )}
      <div className="event-card-body">
        <div className="event-card-header">
          <h3>{event.title}</h3>
          {event.category && <span className="badge category-tag">{event.category}</span>}
        </div>
        <p className="text-muted small">{formatDate(event.event_date)}</p>
        {event.venue && <p className="text-muted small">{event.venue}</p>}
        <p className={seatsLeft <= 0 ? 'seats-full' : 'seats-left'}>
          {seatsLeft <= 0 ? 'Full' : `${seatsLeft} seats left`}
        </p>
      </div>
    </Link>
  )
}
