import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

/**
 * Gestion des droits - Prompt 02.
 *
 * Aucun role code en dur : chaque utilisateur a une ligne de droits par
 * module (Lecture / Creation / Modification), stockee en base et editable
 * ici. C'est cette grille qui pilote ce que l'utilisateur peut faire.
 */
export default function Rights() {
  const [users, setUsers] = useState([])
  const [modules, setModules] = useState([])
  const [grid, setGrid] = useState({})
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [newUser, setNewUser] = useState({ name: '', email: '' })

  async function loadMatrix() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/permissions-matrix.php')
      setUsers(data.users)
      setModules(data.modules)
      setGrid(data.grid || {})
      if (data.users.length > 0 && !selectedUserId) {
        setSelectedUserId(data.users[0].id)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMatrix()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedUserId == null) return
    const userGrid = grid[selectedUserId] || {}
    const next = {}
    for (const mod of modules) {
      next[mod.id] = userGrid[mod.id] || { can_read: false, can_create: false, can_edit: false }
    }
    setDraft(next)
  }, [selectedUserId, grid, modules])

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  )

  function toggle(moduleId, field) {
    setDraft((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: !prev[moduleId]?.[field] },
    }))
  }

  async function save() {
    if (!selectedUserId) return
    setSaving(true)
    setError(null)
    try {
      const permissions = modules.map((mod) => ({
        permission_id: mod.id,
        can_read: !!draft[mod.id]?.can_read,
        can_create: !!draft[mod.id]?.can_create,
        can_edit: !!draft[mod.id]?.can_edit,
      }))
      await api.post('/permissions-update.php', { user_id: selectedUserId, permissions })
      setGrid((prev) => ({
        ...prev,
        [selectedUserId]: Object.fromEntries(
          permissions.map((p) => [p.permission_id, p])
        ),
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function createUser(e) {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) return
    setError(null)
    try {
      const res = await api.post('/users.php', newUser)
      setNewUser({ name: '', email: '' })
      await loadMatrix()
      setSelectedUserId(res.data.id)
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) {
    return <div className="page">Chargement...</div>
  }

  return (
    <div className="page rights-page">
      <h1>Gestion des droits</h1>
      {error && <p className="error-banner">{error}</p>}

      <div className="rights-layout">
        <aside className="rights-users">
          <h2>Utilisateurs</h2>
          <ul>
            {users.map((u) => (
              <li key={u.id}>
                <button
                  className={u.id === selectedUserId ? 'active' : ''}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  {u.name}
                  <span className="email">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={createUser} className="new-user-form">
            <h3>Ajouter un utilisateur</h3>
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
        </aside>

        <section className="rights-matrix">
          {selectedUser ? (
            <>
              <h2>Droits de {selectedUser.name}</h2>
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Lecture</th>
                    <th>Creation</th>
                    <th>Modification</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr key={mod.id}>
                      <td>{mod.module_label}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!draft[mod.id]?.can_read}
                          onChange={() => toggle(mod.id, 'can_read')}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!draft[mod.id]?.can_create}
                          onChange={() => toggle(mod.id, 'can_create')}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!draft[mod.id]?.can_edit}
                          onChange={() => toggle(mod.id, 'can_edit')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={save} disabled={saving} className="save-button">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <p>Aucun utilisateur. Ajoutes-en un pour commencer.</p>
          )}
        </section>
      </div>
    </div>
  )
}
