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
    <Link
      to={`/events/${event.id}`}
      className="block bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {event.banner_url && (
        <img
          src={event.banner_url}
          alt={`${event.title} banner`}
          className="w-full h-36 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{event.title}</h3>
          {event.category && (
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              {event.category}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{formatDate(event.event_date)}</p>
        {event.venue && <p className="text-sm text-gray-500">{event.venue}</p>}
        <p className={`text-sm mt-2 ${seatsLeft <= 0 ? 'text-red-600' : 'text-green-700'}`}>
          {seatsLeft <= 0 ? 'Full' : `${seatsLeft} seats left`}
        </p>
      </div>
    </Link>
  )
}
