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
      <h1 className="text-2xl font-bold mb-4">Admin — Pending Events</h1>

      {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2 mb-4">{message}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-4">{error}</p>}

      {pending.length === 0 ? (
        <p className="text-gray-500">No events waiting for approval.</p>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm divide-y">
          {pending.map((event) => (
            <div key={event.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(event.event_date)} · {event.venue || 'No venue'} · capacity {event.capacity}
                  </p>
                  <p className="text-sm text-gray-500">By {event.organizer_name}</p>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setStatus(event.id, 'approved')}
                    className="bg-green-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setStatus(event.id, 'rejected')}
                    className="border border-red-300 text-red-600 rounded-md px-3 py-1.5 text-sm hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
