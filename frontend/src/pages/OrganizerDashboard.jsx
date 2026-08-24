import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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
      <div className="page-header-row">
        <h1>Organizer Dashboard</h1>
        <Link to="/organizer/create" className="btn btn-primary">Create event</Link>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <div className="card mb">
        <h2>Check-in (mark attendance)</h2>
        <p className="text-muted small">
          Scan the attendee's QR ticket with any scanner and paste the ticket ID, or type it in.
        </p>
        <form onSubmit={markAttendance} className="checkin-form">
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Ticket ID (from QR code)"
            required
            aria-label="Ticket ID"
          />
          <button type="submit" className="btn btn-primary">Mark attended</button>
        </form>
        {scanResult && (
          scanResult.already_checked_in ? (
            <p className="alert alert-warning mt">
              Already checked in: {scanResult.attendee_name} — this ticket was used before.
              Possible ticket sharing.
            </p>
          ) : (
            <p className="alert alert-success mt">Checked in: {scanResult.attendee_name}</p>
          )
        )}
      </div>

      <h2>My Events</h2>
      {events.length === 0 ? (
        <p className="text-muted small">No events yet — create your first one.</p>
      ) : (
        <div className="list">
          {events.map((event) => (
            <div key={event.id} className="list-row">
              <div>
                <h3>{event.title}</h3>
                <p className="text-muted small">{formatDate(event.event_date)}</p>
              </div>
              <div className="list-row-actions">
                <span className={`badge badge-${event.status}`}>{event.status}</span>
                <button onClick={() => viewAttendees(event)} className="btn btn-sm">
                  Registrations
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="card mt">
          <h2>Registrations — {selected.title} ({attendees.length})</h2>
          {attendees.length === 0 ? (
            <p className="text-muted small">No registrations yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Attended</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td>
                      {a.attended ? (
                        <span className="ticket-attended">Yes</span>
                      ) : (
                        <span className="text-muted">No</span>
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
