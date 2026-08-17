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
import Fleet from '../pages/Fleet.jsx'
import Scanner from '../pages/Scanner.jsx'
import CantineService from '../pages/CantineService.jsx'
import Abonnements from '../pages/Abonnements.jsx'; import Finance from '../pages/Finance.jsx'
import Notifications from '../pages/Notifications.jsx'
import Parents from '../pages/Parents.jsx'
import JournalActivite from '../pages/JournalActivite.jsx'
import ModulesEcole from '../pages/ModulesEcole.jsx'
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
        path="/fleet"
        element={
          <PrivateRoute>
            <Fleet />
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
      <Route
        path="/cantine-service"
        element={
          <PrivateRoute>
            <CantineService />
          </PrivateRoute>
        }
      />
      <Route
          path="/abonnements"
          element={
                <PrivateRoute>
                      <Abonnements />
                    </PrivateRoute>
                  }
                />
      <Route
        path="/finance" element={<PrivateRoute><Finance /></PrivateRoute>} /><Route path="/notifications"
        element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        }
      />
      <Route
        path="/parents"
        element={
          <AdminRoute>
            <Parents />
          </AdminRoute>
        }
      />
      <Route
        path="/journal-activite"
        element={
          <AdminRoute>
            <JournalActivite />
          </AdminRoute>
        }
      />
      <Route
        path="/modules-ecole"
        element={
          <AdminRoute>
            <ModulesEcole />
          </AdminRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
