import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_STYLES = {
  pending: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [ticketId, setTicketId] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/events/mine').then(setEvents).catch((err) => setError(err.message))
  }, [])

  async function viewAttendees(event) {
    setSelected(event)
    setScanResult(null)
    setError('')
    try {
      setAttendees(await api(`/registrations/event/${event.id}`))
    } catch (err) {
      setError(err.message)
    }
  }

  async function markAttendance(e) {
    e.preventDefault()
    setScanResult(null)
    setError('')
    try {
      const result = await api('/registrations/attendance', {
        method: 'POST',
        body: { ticket_id: ticketId.trim() },
      })
      setScanResult(result)
      setTicketId('')
      if (selected) viewAttendees(selected) // refresh the list
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
        <Link
          to="/organizer/create"
          className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm hover:bg-indigo-700"
        >
          Create event
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-4">{error}</p>}

      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <h2 className="font-semibold mb-2">Check-in (mark attendance)</h2>
        <p className="text-sm text-gray-500 mb-3">
          Scan the attendee's QR ticket with any scanner and paste the ticket ID, or type it in.
        </p>
        <form onSubmit={markAttendance} className="flex gap-2">
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Ticket ID (from QR code)"
            required
            className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Ticket ID"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm hover:bg-indigo-700"
          >
            Mark attended
          </button>
        </form>
        {scanResult && (
          scanResult.already_checked_in ? (
            <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded-md p-2">
              Already checked in: {scanResult.attendee_name} — this ticket was used before.
              Possible ticket sharing.
            </p>
          ) : (
            <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
              Checked in: {scanResult.attendee_name}
            </p>
          )
        )}
      </div>

      <h2 className="font-semibold mb-2">My Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm">No events yet — create your first one.</p>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm divide-y">
          {events.map((event) => (
            <div key={event.id} className="p-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">{event.title}</h3>
                <p className="text-sm text-gray-500">{formatDate(event.event_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[event.status]}`}>
                  {event.status}
                </span>
                <button
                  onClick={() => viewAttendees(event)}
                  className="text-sm border rounded-md px-3 py-1.5 hover:bg-gray-50"
                >
                  Registrations
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 bg-white rounded-lg border shadow-sm p-4">
          <h2 className="font-semibold mb-3">
            Registrations — {selected.title} ({attendees.length})
          </h2>
          {attendees.length === 0 ? (
            <p className="text-gray-500 text-sm">No registrations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-2 font-medium">Name</th>
                  <th className="py-2 pr-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Attended</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{a.name}</td>
                    <td className="py-2 pr-2">{a.email}</td>
                    <td className="py-2">
                      {a.attended ? (
                        <span className="text-green-700">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
