import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">Event Portal</Link>

        <div className="nav-links">
          <Link to="/">Events</Link>

          {user && <Link to="/my-tickets">My Tickets</Link>}
          {user && (user.role === 'organizer' || user.role === 'admin') && (
            <Link to="/organizer">Organizer</Link>
          )}
          {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}

          {user ? (
            <>
              <span className="text-muted">{user.name} ({user.role})</span>
              <button onClick={handleLogout} className="btn btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
