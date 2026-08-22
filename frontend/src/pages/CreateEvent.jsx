import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Coding',
    venue: '',
    event_date: '',
    capacity: 100,
    banner_url: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/events', {
        method: 'POST',
        body: { ...form, capacity: Number(form.capacity) },
      })
      navigate('/organizer')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg border shadow-sm p-6">
      <h1 className="text-xl font-bold mb-4">Create Event</h1>
      <p className="text-sm text-gray-500 mb-4">
        New events need admin approval before they appear in listings.
      </p>

      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm mb-1">Title</label>
          <input id="title" required value={form.title} onChange={set('title')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm mb-1">Description</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={set('description')}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="category" className="block text-sm mb-1">Category</label>
            <select id="category" value={form.category} onChange={set('category')} className={`${inputClass} bg-white`}>
              {['Coding', 'Cultural', 'Sports', 'Workshop', 'Seminar'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm mb-1">Capacity</label>
            <input
              id="capacity"
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={set('capacity')}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="venue" className="block text-sm mb-1">Venue</label>
          <input id="venue" value={form.venue} onChange={set('venue')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="event_date" className="block text-sm mb-1">Date &amp; time</label>
          <input
            id="event_date"
            type="datetime-local"
            required
            value={form.event_date}
            onChange={set('event_date')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="banner_url" className="block text-sm mb-1">Banner image URL (optional)</label>
          <input
            id="banner_url"
            type="url"
            value={form.banner_url}
            onChange={set('banner_url')}
            className={inputClass}
            placeholder="https://…"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Creating…' : 'Create event'}
        </button>
      </form>
    </div>
  )
}
