import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })
}

export default function EventDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [myEvents, setMyEvents] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() {
    api(`/events/${id}`).then(setEvent).catch((err) => setError(err.message))
    if (user) {
      api('/registrations/my-events').then(setMyEvents).catch(() => {})
    }
  }

  useEffect(load, [id, user])

  if (error && !event) return <p className="alert alert-error">{error}</p>
  if (!event) return <p className="text-muted">Loading…</p>

  const seatsLeft = event.capacity - event.registered_count
  const isRegistered = myEvents.some((e) => e.event_id === event.id)

  async function handleRegister() {
    setError('')
    setMessage('')
    try {
      await api('/registrations', { method: 'POST', body: { event_id: event.id } })
      setMessage('Registered! Find your QR ticket in My Tickets.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCancel() {
    setError('')
    setMessage('')
    try {
      await api(`/registrations/${event.id}`, { method: 'DELETE' })
      setMessage('Registration cancelled.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="detail">
      {event.banner_url && (
        <img src={event.banner_url} alt={`${event.title} banner`} className="detail-banner" />
      )}

      <div className="card">
        <div className="detail-header">
          <h1>{event.title}</h1>
          {event.category && <span className="badge category-tag">{event.category}</span>}
        </div>

        <dl className="detail-meta">
          <div><dt>When: </dt><dd>{formatDate(event.event_date)}</dd></div>
          {event.venue && <div><dt>Where: </dt><dd>{event.venue}</dd></div>}
          <div><dt>Organizer: </dt><dd>{event.organizer_name}</dd></div>
          <div><dt>Seats: </dt><dd>{event.registered_count} / {event.capacity} filled</dd></div>
        </dl>

        {event.description && <p className="detail-description">{event.description}</p>}

        {message && <p className="alert alert-success mt">{message}</p>}
        {error && <p className="alert alert-error mt">{error}</p>}

        <div className="detail-actions">
          {!user ? (
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              Login to register
            </button>
          ) : isRegistered ? (
            <button onClick={handleCancel} className="btn btn-danger-outline">
              Cancel registration
            </button>
          ) : seatsLeft <= 0 ? (
            <span className="seats-full">Event is full</span>
          ) : (
            <button onClick={handleRegister} className="btn btn-primary">
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
