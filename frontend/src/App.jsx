import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import MyTickets from './pages/MyTickets'
import OrganizerDashboard from './pages/OrganizerDashboard'
import CreateEvent from './pages/CreateEvent'
import AdminPanel from './pages/AdminPanel'

// Wrapper that redirects to /login when not authenticated (optionally by role)
function Protected({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/my-tickets"
            element={<Protected><MyTickets /></Protected>}
          />
          <Route
            path="/organizer"
            element={<Protected roles={['organizer', 'admin']}><OrganizerDashboard /></Protected>}
          />
          <Route
            path="/organizer/create"
            element={<Protected roles={['organizer', 'admin']}><CreateEvent /></Protected>}
          />
          <Route
            path="/admin"
            element={<Protected roles={['admin']}><AdminPanel /></Protected>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
