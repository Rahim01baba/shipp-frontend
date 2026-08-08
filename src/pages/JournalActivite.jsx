import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const ACTION_LABELS = {
  create: 'Creation',
  update: 'Modification',
  delete: 'Suppression',
  login: 'Connexion',
}

export default function JournalActivite() {
  const { accessLoading } = useAuth()
  const [entries, setEntries] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [moduleFilter, setModuleFilter] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [journalRes, usersRes] = await Promise.all([
        api.get('/crud.php?module=journal_activite'),
        api.get('/crud.php?module=utilisateurs'),
      ])
      setEntries(journalRes.data || [])
      setUsers(usersRes.data || [])
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

  function userLabel(userId) {
    const u = users.find((u) => String(u.id) === String(userId))
    return u ? u.name : `Utilisateur #${userId}`
  }

  const moduleKeys = Array.from(new Set(entries.map((e) => e.module_key))).sort()
  const filtered = moduleFilter ? entries.filter((e) => e.module_key === moduleFilter) : entries

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Journal d'activite</h1>
      <p>Historique en lecture seule des creations, modifications et suppressions.</p>
      {error && <p className="error-banner">{error}</p>}

      <label className="module-form-field">
        <span>Filtrer par module</span>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          <option value="">Tous les modules</option>
          {moduleKeys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Module</th>
                <th>Fiche</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>{e.created_at}</td>
                  <td>{userLabel(e.user_id)}</td>
                  <td>{ACTION_LABELS[e.action] || e.action}</td>
                  <td>{e.module_key}</td>
                  <td>{e.record_id || '-'}</td>
                  <td>{e.details || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>Aucune entree.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

