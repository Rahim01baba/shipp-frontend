import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { MODULES } from '../config/modules.js'

export default function Dashboard() {
  const { user, logout, isAdmin, can, accessLoading } = useAuth()
  const [status, setStatus] = useState('Verification de l\'API...')

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    fetch(`${apiUrl}/health.php`)
      .then((r) => r.json())
      .then((data) => setStatus(`API OK — base de donnees: ${data.db ? 'connectee' : 'indisponible'}`))
      .catch(() => setStatus('API injoignable'))
  }, [])

  const visibleModules = MODULES.filter((m) => can(m.key, 'can_read'))

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>SHIPP</h1>
          <p>{status}</p>
          {user && (
            <p>
              Connecte en tant que {user.name} ({user.email})
            </p>
          )}
        </div>
        <button type="button" onClick={logout}>
          Se deconnecter
        </button>
      </div>

      <h2>Modules</h2>
      {accessLoading ? (
        <p>Chargement des droits...</p>
      ) : (
        <div className="module-links">
          {isAdmin && (
            <Link to="/rights" className="module-link">
              Gestion des droits
            </Link>
          )}
          {isAdmin && (
            <Link to="/annees-scolaires" className="module-link">
              Annees scolaires
            </Link>
          )}
          {can('trajets', 'can_read') && (
            <Link to="/trajets" className="module-link">
              Trajets
            </Link>
          )}
          {visibleModules.map((m) => (
            <Link key={m.key} to={`/modules/${m.key}`} className="module-link">
              {m.label}
            </Link>
          ))}
          {visibleModules.length === 0 && !isAdmin && <p>Aucun module accessible avec votre compte.</p>}
        </div>
      )}
    </div>
  )
}
