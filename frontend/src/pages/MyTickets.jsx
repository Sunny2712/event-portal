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

  if (loading) return <p className="text-gray-500">Loading…</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Tickets</h1>

      {tickets.length === 0 ? (
        <p className="text-gray-500">You haven't registered for any events yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tickets.map((t) => (
            <div key={t.ticket_id} className="bg-white rounded-lg border shadow-sm p-4 flex gap-4">
              <div className="bg-white p-1 border rounded-md self-start">
                <QRCodeSVG value={t.ticket_id} size={96} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{t.title}</h3>
                <p className="text-sm text-gray-600">{formatDate(t.event_date)}</p>
                {t.venue && <p className="text-sm text-gray-500">{t.venue}</p>}
                <p className="text-xs text-gray-400 mt-1 break-all">Ticket: {t.ticket_id}</p>
                <p className={`text-sm mt-1 ${t.attended ? 'text-green-700' : 'text-gray-500'}`}>
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
