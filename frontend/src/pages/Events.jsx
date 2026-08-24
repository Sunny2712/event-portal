import { useEffect, useState } from 'react'
import { api } from '../api'
import EventCard from '../components/EventCard'

const CATEGORIES = ['', 'Coding', 'Cultural', 'Sports', 'Workshop', 'Seminar']

export default function Events() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)

    setLoading(true)
    api(`/events?${params}`)
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [search, category])

  return (
    <div>
      <h1>Upcoming Events</h1>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search events"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || 'All categories'}</option>
          ))}
        </select>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-muted">No events found.</p>
      ) : (
        <div className="card-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
