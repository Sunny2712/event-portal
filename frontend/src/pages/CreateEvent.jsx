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

  return (
    <div className="form-card">
      <h1>Create Event</h1>
      <p className="text-muted small mb">
        New events need admin approval before they appear in listings.
      </p>

      {error && <p className="alert alert-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input id="title" required value={form.title} onChange={set('title')} />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={4} value={form.description} onChange={set('description')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={set('category')}>
              {['Coding', 'Cultural', 'Sports', 'Workshop', 'Seminar'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Capacity</label>
            <input
              id="capacity"
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={set('capacity')}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="venue">Venue</label>
          <input id="venue" value={form.venue} onChange={set('venue')} />
        </div>
        <div className="form-group">
          <label htmlFor="event_date">Date &amp; time</label>
          <input
            id="event_date"
            type="datetime-local"
            required
            value={form.event_date}
            onChange={set('event_date')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="banner_url">Banner image URL (optional)</label>
          <input
            id="banner_url"
            type="url"
            value={form.banner_url}
            onChange={set('banner_url')}
            placeholder="https://…"
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
          {loading ? 'Creating…' : 'Create event'}
        </button>
      </form>
    </div>
  )
}
