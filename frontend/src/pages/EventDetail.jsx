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

  if (error && !event) return <p className="text-red-600">{error}</p>
  if (!event) return <p className="text-gray-500">Loading…</p>

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
    <div className="max-w-2xl mx-auto">
      {event.banner_url && (
        <img
          src={event.banner_url}
          alt={`${event.title} banner`}
          className="w-full h-56 object-cover rounded-lg mb-4"
        />
      )}

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          {event.category && (
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
              {event.category}
            </span>
          )}
        </div>

        <dl className="mt-4 space-y-1 text-sm text-gray-700">
          <div><dt className="inline font-medium">When: </dt><dd className="inline">{formatDate(event.event_date)}</dd></div>
          {event.venue && (
            <div><dt className="inline font-medium">Where: </dt><dd className="inline">{event.venue}</dd></div>
          )}
          <div><dt className="inline font-medium">Organizer: </dt><dd className="inline">{event.organizer_name}</dd></div>
          <div>
            <dt className="inline font-medium">Seats: </dt>
            <dd className="inline">{event.registered_count} / {event.capacity} filled</dd>
          </div>
        </dl>

        {event.description && (
          <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{event.description}</p>
        )}

        {message && <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

        <div className="mt-6">
          {!user ? (
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm hover:bg-indigo-700"
            >
              Login to register
            </button>
          ) : isRegistered ? (
            <button
              onClick={handleCancel}
              className="border border-red-300 text-red-600 rounded-md px-4 py-2 text-sm hover:bg-red-50"
            >
              Cancel registration
            </button>
          ) : seatsLeft <= 0 ? (
            <span className="text-red-600 text-sm font-medium">Event is full</span>
          ) : (
            <button
              onClick={handleRegister}
              className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm hover:bg-indigo-700"
            >
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
