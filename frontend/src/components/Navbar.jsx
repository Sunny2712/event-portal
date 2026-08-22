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
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-indigo-600">
          Event Portal
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-indigo-600">Events</Link>

          {user && (
            <Link to="/my-tickets" className="hover:text-indigo-600">My Tickets</Link>
          )}
          {user && (user.role === 'organizer' || user.role === 'admin') && (
            <Link to="/organizer" className="hover:text-indigo-600">Organizer</Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="hover:text-indigo-600">Admin</Link>
          )}

          {user ? (
            <>
              <span className="text-gray-500 hidden sm:inline">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-md border hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-md border hover:bg-gray-100">
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
