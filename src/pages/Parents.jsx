import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const LIEN_LABELS = {
  pere: 'Pere',
  mere: 'Mere',
  tuteur: 'Tuteur',
  autre: 'Autre',
}

export default function Parents() {
  const { can, accessLoading } = useAuth()
  const [liaisons, setLiaisons] = useState([])
  const [users, setUsers] = useState([])
  const [eleves, setEleves] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ user_id: '', eleve_id: '', lien: 'autre' })

  const canCreate = can('parent_liaisons', 'can_create')
  const canDelete = can('parent_liaisons', 'can_delete')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [liaisonsRes, usersRes, elevesRes] = await Promise.all([
        api.get('/crud.php?module=parent_liaisons'),
        api.get('/crud.php?module=utilisateurs'),
        api.get('/crud.php?module=eleves'),
      ])
      setLiaisons(liaisonsRes.data || [])
      setUsers(usersRes.data || [])
      setEleves(elevesRes.data || [])
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.user_id || !form.eleve_id) {
      setError('Selectionnez un utilisateur et un eleve')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post('/crud.php?module=parent_liaisons', {
        user_id: Number(form.user_id),
        eleve_id: Number(form.eleve_id),
        lien: form.lien,
      })
      setForm({ user_id: '', eleve_id: '', lien: 'autre' })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setError(null)
    try {
      await api.del('/crud.php?module=parent_liaisons', { id })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  function userLabel(userId) {
    const u = users.find((u) => String(u.id) === String(userId))
    return u ? `${u.name} (${u.email})` : `Utilisateur #${userId}`
  }

  function eleveLabel(eleveId) {
    const e = eleves.find((e) => String(e.id) === String(eleveId))
    return e ? `${e.nom} ${e.prenom}` : `Eleve #${eleveId}`
  }

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Parents</h1>
      <p>Lie un compte utilisateur (parent) a un ou plusieurs eleves. Un parent lie ne voit que les donnees de ses enfants.</p>
      {error && <p className="error-banner">{error}</p>}

      {canCreate && (
        <form onSubmit={handleSubmit} className="module-form">
          <label className="module-form-field">
            <span>Utilisateur</span>
            <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
              <option value="">-- Choisir --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>
          <label className="module-form-field">
            <span>Eleve</span>
            <select value={form.eleve_id} onChange={(e) => setForm({ ...form, eleve_id: e.target.value })}>
              <option value="">-- Choisir --</option>
              {eleves.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} {e.prenom}
                </option>
              ))}
            </select>
          </label>
          <label className="module-form-field">
            <span>Lien</span>
            <select value={form.lien} onChange={(e) => setForm({ ...form, lien: e.target.value })}>
              {Object.entries(LIEN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="module-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Lier'}
            </button>
          </div>
        </form>
      )}

      <h2>Liaisons existantes</h2>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Eleve</th>
                <th>Lien</th>
                {canDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {liaisons.map((l) => (
                <tr key={l.id}>
                  <td>{userLabel(l.user_id)}</td>
                  <td>{eleveLabel(l.eleve_id)}</td>
                  <td>{LIEN_LABELS[l.lien] || l.lien}</td>
                  {canDelete && (
                    <td className="module-table-actions">
                      <button type="button" onClick={() => handleDelete(l.id)}>
                        Delier
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {liaisons.length === 0 && (
                <tr>
                  <td colSpan={canDelete ? 4 : 3}>Aucune liaison.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

