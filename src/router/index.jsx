import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Rights from '../pages/Rights.jsx'
import ModuleCrud from '../pages/ModuleCrud.jsx'
import EleveDetail from '../pages/EleveDetail.jsx'
import AnneesScolaires from '../pages/AnneesScolaires.jsx'
import CircuitDetail from '../pages/CircuitDetail.jsx'
import Trajets from '../pages/Trajets.jsx'
import Scanner from '../pages/Scanner.jsx'
import NotFound from '../pages/NotFound.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return <div className="page page-center">Chargement...</div>
  }
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin, accessLoading } = useAuth()
  const location = useLocation()
  if (loading || accessLoading) {
    return <div className="page page-center">Chargement...</div>
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return isAdmin ? children : <Navigate to="/" replace />
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
          <AdminRoute>
            <Rights />
          </AdminRoute>
        }
      />
      <Route
        path="/annees-scolaires"
        element={
          <AdminRoute>
            <AnneesScolaires />
          </AdminRoute>
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
      <Route
        path="/eleves/:id"
        element={
          <PrivateRoute>
            <EleveDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/circuits/:id"
        element={
          <PrivateRoute>
            <CircuitDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/trajets"
        element={
          <PrivateRoute>
            <Trajets />
          </PrivateRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <PrivateRoute>
            <Scanner />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
