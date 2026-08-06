import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { MODULES } from '../config/modules.js'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [status, setStatus] = useState('Verification de l\'API...')

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    fetch(`${apiUrl}/health.php`)
      .then((r) => r.json())
      .then((data) => setStatus(`API OK — base de donnees: ${data.db ? 'connectee' : 'indisponible'}`))
      .catch(() => setStatus('API injoignable'))
  }, [])

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
      <div className="module-links">
        <Link to="/rights" className="module-link">
          Gestion des droits
        </Link>
        {MODULES.map((m) => (
          <Link key={m.key} to={`/modules/${m.key}`} className="module-link">
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
