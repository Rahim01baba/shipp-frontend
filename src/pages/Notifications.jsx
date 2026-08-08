import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Notifications() {
  const { can, accessLoading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marking, setMarking] = useState(null)

  const canEdit = can('notifications', 'can_edit')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/crud.php?module=notifications')
      const sorted = (data.data || []).slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      setNotifications(sorted)
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

  async function marquerLue(id) {
    setMarking(id)
    setError(null)
    try {
      await api.put('/crud.php?module=notifications', { id, statut: 'lue' })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setMarking(null)
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Notifications</h1>
      {error && <p className="error-banner">{error}</p>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n.id} className={n.statut !== 'lue' ? 'notification-card unread' : 'notification-card'}>
              <div>
                <p className="notification-titre">{n.titre}</p>
                <p>{n.message}</p>
                <p className="notification-meta">{n.created_at}</p>
              </div>
              {canEdit && n.statut !== 'lue' && (
                <button type="button" disabled={marking === n.id} onClick={() => marquerLue(n.id)}>
                  {marking === n.id ? '...' : 'Marquer lue'}
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && <p>Aucune notification.</p>}
        </div>
      )}
    </div>
  )
}
