import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../api'

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/registrations/my-events')
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted">Loading…</p>
  if (error) return <p className="alert alert-error">{error}</p>

  return (
    <div>
      <h1>My Tickets</h1>

      {tickets.length === 0 ? (
        <p className="text-muted">You haven't registered for any events yet.</p>
      ) : (
        <div className="ticket-grid">
          {tickets.map((t) => (
            <div key={t.ticket_id} className="ticket-card">
              <div className="ticket-qr">
                <QRCodeSVG value={t.ticket_id} size={96} />
              </div>
              <div className="ticket-info">
                <h3>{t.title}</h3>
                <p className="text-muted small">{formatDate(t.event_date)}</p>
                {t.venue && <p className="text-muted small">{t.venue}</p>}
                <p className="ticket-id">Ticket: {t.ticket_id}</p>
                <p className={t.attended ? 'ticket-attended' : 'ticket-not-attended'}>
                  {t.attended ? 'Attended' : 'Not checked in yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
