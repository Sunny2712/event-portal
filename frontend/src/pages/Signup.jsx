import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
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
      await signup(form.name, form.email, form.password, form.role)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>Sign up</h1>

      {error && <p className="alert alert-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" required value={form.name} onChange={set('name')} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={set('password')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">I am a</label>
          <select id="role" value={form.role} onChange={set('role')}>
            <option value="student">Student</option>
            <option value="organizer">Organizer</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-block">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="form-footer">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
