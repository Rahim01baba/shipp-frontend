import { Fragment, useEffect, useState } from 'react'
import { api } from '../api/client.js'

/**
 * Gestion des droits — matrice type Jenkins (Prompt 02).
 *
 * Une seule grande table : chaque module est un groupe de 4 colonnes
 * (C = Création, E = Édition, S = Suppression, L = Lecture) et chaque
 * ligne est un utilisateur. Chaque case a cocher sauvegarde immédiatement
 * en base (pas de bouton "Enregistrer" global).
 */
export default function Rights() {
  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([])
  const [grid, setGrid] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingUserId, setSavingUserId] = useState(null)
  const [newUser, setNewUser] = useState({ name: '', email: '' })

  async function loadMatrix() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/permissions-matrix.php')
      setUsers(data.users)
      setModules(data.modules)
      setGrid(data.grid || {})
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatrix()
  }, [])

  function cellValue(userId, moduleId, field) {
    return !!grid[userId]?.[moduleId]?.[field]
  }

  async function toggle(userId, moduleId, field) {
    const prevGrid = grid
    const userGrid = grid[userId] || {}
    const current = userGrid[moduleId] || {
      can_read: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    }
    const updatedCell = { ...current, [field]: !current[field] }
    const nextUserGrid = { ...userGrid, [moduleId]: updatedCell }
    const nextGrid = { ...grid, [userId]: nextUserGrid }
    setGrid(nextGrid)
    setSavingUserId(userId)
    setError(null)
    try {
      const permissions = modules.map((mod) => {
        const cell = nextUserGrid[mod.id] || {
          can_read: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        }
        return {
          permission_id: mod.id,
          can_read: !!cell.can_read,
          can_create: !!cell.can_create,
          can_edit: !!cell.can_edit,
          can_delete: !!cell.can_delete,
        }
      })
      await api.post('/permissions-update.php', { user_id: userId, permissions })
    } catch (e) {
      setError(e.message)
      setGrid(prevGrid)
    } finally {
      setSavingUserId(null)
    }
  }

  async function createUser(e) {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) return
    setError(null)
    try {
      await api.post('/users.php', newUser)
      setNewUser({ name: '', email: '' })
      await loadMatrix()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) {
    return <div className="page">Chargement...</div>
  }

  const colCount = 1 + modules.length * 4

  return (
    <div className="page rights-page">
      <h1>Gestion des droits</h1>
      {error && <p className="error-banner">{error}</p>}

      <div className="rights-matrix-wrap">
        <table className="rights-matrix-table">
          <thead>
            <tr>
              <th className="col-user" rowSpan={2}>
                Utilisateur / Groupe
              </th>
              {modules.map((mod) => (
                <th key={mod.id} className="col-module-group" colSpan={4}>
                  {mod.module_label}
                </th>
              ))}
            </tr>
            <tr>
              {modules.map((mod) => (
                <Fragment key={mod.id}>
                  <th className="col-sub" title="Création">
                    C
                  </th>
                  <th className="col-sub" title="Édition">
                    E
                  </th>
                  <th className="col-sub" title="Suppression">
                    S
                  </th>
                  <th className="col-sub col-sub-last" title="Lecture">
                    L
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={savingUserId === u.id ? 'row-saving' : ''}>
                <td className="col-user">
                  <div className="user-name">{u.name}</div>
                  <div className="email">{u.email}</div>
                </td>
                {modules.map((mod) => (
                  <Fragment key={mod.id}>
                    <td className="col-sub">
                      <input
                        type="checkbox"
                        checked={cellValue(u.id, mod.id, 'can_create')}
                        onChange={() => toggle(u.id, mod.id, 'can_create')}
                      />
                    </td>
                    <td className="col-sub">
                      <input
                        type="checkbox"
                        checked={cellValue(u.id, mod.id, 'can_edit')}
                        onChange={() => toggle(u.id, mod.id, 'can_edit')}
                      />
                    </td>
                    <td className="col-sub">
                      <input
                        type="checkbox"
                        checked={cellValue(u.id, mod.id, 'can_delete')}
                        onChange={() => toggle(u.id, mod.id, 'can_delete')}
                      />
                    </td>
                    <td className="col-sub col-sub-last">
                      <input
                        type="checkbox"
                        checked={cellValue(u.id, mod.id, 'can_read')}
                        onChange={() => toggle(u.id, mod.id, 'can_read')}
                      />
                    </td>
                  </Fragment>
                ))}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={colCount}>Aucun utilisateur. Ajoutes-en un ci-dessous.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={createUser} className="add-user-bar">
        <span className="add-user-label">Utilisateur a ajouter :</span>
        <input
          type="text"
          placeholder="Nom"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  )
}
