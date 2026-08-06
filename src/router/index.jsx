import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Rights from '../pages/Rights.jsx'
import ModuleCrud from '../pages/ModuleCrud.jsx'
import NotFound from '../pages/NotFound.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return <div className="page page-center">Chargement...</div>
  }
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/rights"
        element={
          <PrivateRoute>
            <Rights />
          </PrivateRoute>
        }
      />
      <Route
        path="/modules/:moduleKey"
        element={
          <PrivateRoute>
            <ModuleCrud />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
