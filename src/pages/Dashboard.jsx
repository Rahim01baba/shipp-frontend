import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { MODULES } from '../config/modules.js'

export default function Dashboard() {
  const { user, logout, isAdmin, can, accessLoading, parentEleveIds } = useAuth()
  const [status, setStatus] = useState('Verification de l\'API...')
  const [widgets, setWidgets] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [myChildren, setMyChildren] = useState([])

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api'
    fetch(`${apiUrl}/health.php`)
      .then((r) => r.json())
      .then((data) => setStatus(`API OK — base de donnees: ${data.db ? 'connectee' : 'indisponible'}`))
      .catch(() => setStatus('API injoignable'))
  }, [])

  useEffect(() => {
    if (accessLoading) return
    async function loadWidgets() {
      const today = new Date().toISOString().slice(0, 10)
      const [eleves, abonnements, trajets, scans, notifications] = await Promise.all([
        can('eleves', 'can_read') ? api.get('/crud.php?module=eleves') : Promise.resolve(null),
        can('abonnements', 'can_read') ? api.get('/crud.php?module=abonnements') : Promise.resolve(null),
        can('trajets', 'can_read') ? api.get('/crud.php?module=trajets') : Promise.resolve(null),
        can('scans', 'can_read') ? api.get('/crud.php?module=scans') : Promise.resolve(null),
        can('notifications', 'can_read') ? api.get('/crud.php?module=notifications') : Promise.resolve(null),
      ])

      const w = {}
      if (eleves) {
        const list = eleves.data || []
        w.eleves = { total: list.length, actifs: list.filter((e) => e.statut === 'actif').length }
      }
      if (abonnements) {
        const list = abonnements.data || []
        w.abonnements = { total: list.length, actifs: list.filter((a) => a.statut === 'actif').length }
      }
      if (trajets) {
        const list = (trajets.data || []).filter((t) => t.date_trajet === today)
        w.trajets = {
          total: list.length,
          enCours: list.filter((t) => t.statut === 'en_cours').length,
        }
      }
      if (scans) {
        const list = (scans.data || []).filter((s) => (s.scanned_at || '').slice(0, 10) === today)
        w.scans = { total: list.length }
      }
      setWidgets(w)
      if (parentEleveIds && parentEleveIds.length > 0 && eleves) {
        setMyChildren(eleves.data || [])
      }

      if (notifications) {
        const nonLues = (notifications.data || []).filter((n) => n.statut !== 'lue').length
        setNotifCount(nonLues)
      }
    }
    loadWidgets()
  }, [accessLoading, can])

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

      {parentEleveIds && parentEleveIds.length > 0 && (
        <>
          <h2>Mes enfants</h2>
          <div className="module-links">
            {myChildren.map((e) => (
              <Link key={e.id} to={`/eleves/${e.id}`} className="module-link">
                {e.nom} {e.prenom}
              </Link>
            ))}
          </div>
        </>
      )}

      {widgets && (
        <div className="dashboard-widgets">
          {widgets.eleves && (
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{widgets.eleves.actifs}</span>
              <span className="dashboard-widget-label">Eleves actifs / {widgets.eleves.total}</span>
            </div>
          )}
          {widgets.abonnements && (
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{widgets.abonnements.actifs}</span>
              <span className="dashboard-widget-label">Abonnements actifs / {widgets.abonnements.total}</span>
            </div>
          )}
          {widgets.trajets && (
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{widgets.trajets.enCours}</span>
              <span className="dashboard-widget-label">Trajets en cours ({widgets.trajets.total} aujourd'hui)</span>
            </div>
          )}
          {widgets.scans && (
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{widgets.scans.total}</span>
              <span className="dashboard-widget-label">Scans aujourd'hui</span>
            </div>
          )}
        </div>
      )}

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
          {isAdmin && (
            <Link to="/parents" className="module-link">
              Parents
            </Link>
          )}
          {isAdmin && (
            <Link to="/journal-activite" className="module-link">
              Journal d'activite
            </Link>
          )}
          {isAdmin && (
            <Link to="/modules-ecole" className="module-link">
              Modules par ecole
            </Link>
          )}
          {can('trajets', 'can_read') && (
            <Link to="/trajets" className="module-link">
              Trajets
            </Link>
          )}
          {can('scans', 'can_create') && (
            <Link to="/scanner" className="module-link">
              Scanner
            </Link>
          )}
          {can('scans', 'can_create') && (
            <Link to="/cantine-service" className="module-link">
              Service Cantine
            </Link>
          )}
          {can('notifications', 'can_read') && (
            <Link to="/notifications" className="module-link">
              Notifications{notifCount > 0 ? ` (${notifCount})` : ''}
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
