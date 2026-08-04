import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Dashboard placeholder - verifie simplement que l'API repond.
// Le vrai dashboard dynamique (par permissions) arrive au Prompt 25.
export default function Dashboard() {
  const [status, setStatus] = useState('Verification de l\'API...')

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    fetch(`${apiUrl}/health.php`)
      .then((r) => r.json())
      .then((data) => setStatus(`API OK - base de donnees: ${data.db ? 'connectee' : 'indisponible'}`))
      .catch(() => setStatus('API injoignable'))
  }, [])

  return (
    <div className="page page-center">
      <h1>SHIPP - Socle applicatif</h1>
      <p>{status}</p>
      <p>
        <Link to="/rights">Gestion des droits &rarr;</Link>
      </p>
    </div>
  )
}
