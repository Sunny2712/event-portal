import { useEffect, useState } from 'react'
import { api } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminPanel() {
  const [pending, setPending] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function load() {
    api('/events/admin/pending').then(setPending).catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function setStatus(id, status) {
    setError('')
    setMessage('')
    try {
      await api(`/events/${id}/status`, { method: 'PUT', body: { status } })
      setMessage(`Event ${status}.`)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1>Admin — Pending Events</h1>

      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {pending.length === 0 ? (
        <p className="text-muted">No events waiting for approval.</p>
      ) : (
        <div className="list">
          {pending.map((event) => (
            <div key={event.id} className="list-row">
              <div>
                <h3>{event.title}</h3>
                <p className="text-muted small">
                  {formatDate(event.event_date)} · {event.venue || 'No venue'} · capacity {event.capacity}
                </p>
                <p className="text-muted small">By {event.organizer_name}</p>
                {event.description && <p className="text-muted small">{event.description}</p>}
              </div>
              <div className="list-row-actions">
                <button onClick={() => setStatus(event.id, 'approved')} className="btn btn-success btn-sm">
                  Approve
                </button>
                <button onClick={() => setStatus(event.id, 'rejected')} className="btn btn-danger-outline btn-sm">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
