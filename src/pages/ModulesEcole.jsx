import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function ModulesEcole() {
  const { accessLoading } = useAuth()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toggling, setToggling] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/modules-ecole.php')
      setModules(res.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessLoading) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLoading])

  async function toggle(moduleKey, current) {
    setToggling(moduleKey)
    setError(null)
    try {
      await api.put('/modules-ecole.php', { module_key: moduleKey, actif: !current })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Modules par ecole</h1>
      <p>Active ou desactive les modules disponibles pour cette ecole.</p>
      {error && <p className="error-banner">{error}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => {
                const actif = String(m.actif) === '1' || m.actif === true
                return (
                  <tr key={m.module_key}>
                    <td>{m.module_label}</td>
                    <td>{actif ? 'Actif' : 'Inactif'}</td>
                    <td className="module-table-actions">
                      <button type="button" disabled={toggling === m.module_key} onClick={() => toggle(m.module_key, actif)}>
                        {toggling === m.module_key ? '...' : actif ? 'Desactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {modules.length === 0 && (
                <tr>
                  <td colSpan={3}>Aucun module.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

