import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Rights from '../pages/Rights.jsx'
import NotFound from '../pages/NotFound.jsx'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
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
      {/*
        TEMPORAIRE : /rights est accessible sans connexion tant que le
        module Authentification (Prompt 01) n'est pas construit. A passer
        derriere <PrivateRoute> des que le login fonctionnera.
      */}
      <Route path="/rights" element={<Rights />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
