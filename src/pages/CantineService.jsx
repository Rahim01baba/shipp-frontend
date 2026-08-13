import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const PERIODE_LABELS = {
  petit_dejeuner: 'Petit dejeuner',
  dejeuner: 'Dejeuner',
  gouter: 'Gouter',
}

function currentPeriode() {
  const hour = new Date().getHours()
  if (hour < 10) return 'petit_dejeuner'
  if (hour < 15) return 'dejeuner'
  return 'gouter'
}

export default function CantineService() {
  const { can, accessLoading } = useAuth()
  const [eleves, setEleves] = useState([])
  const [abonnements, setAbonnements] = useState([])
  const [menus, setMenus] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [marking, setMarking] = useState(null); const [warning, setWarning] = useState(null)

  const canMark = can('scans', 'can_create')
  const periode = currentPeriode()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [elevesRes, abosRes, menusRes, scansRes] = await Promise.all([
        api.get('/crud.php?module=eleves'),
        can('abonnements', 'can_read') ? api.get('/crud.php?module=abonnements') : Promise.resolve({ data: [] }),
        can('menus', 'can_read') ? api.get('/crud.php?module=menus') : Promise.resolve({ data: [] }),
        can('scans', 'can_read') ? api.get('/crud.php?module=scans') : Promise.resolve({ data: [] }),
      ])
      setEleves(elevesRes.data || [])
      setAbonnements(abosRes.data || [])
      setMenus(menusRes.data || [])
      const today = new Date().toISOString().slice(0, 10)
      setScans((scansRes.data || []).filter((s) => (s.scanned_at || '').slice(0, 10) === today && s.type === 'cantine'))
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

  async function marquerServi(eleveId) {
    setMarking(eleveId); setWarning(null)
    setError(null)
    try {
      const token = localStorage.getItem('shipp_token')
      const res = await fetch(`${API_URL}/scan-enregistrer.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ eleve_id: eleveId, type: 'cantine', methode: 'recherche' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erreur lors du pointage'); setWarning(data.abonnement_warning === 'abonnement_suspendu' ? 'Attention : abonnement suspendu (scan tout de meme enregistre).' : null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setMarking(null)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const menuDuJour = menus.find((m) => m.date_menu === today && m.periode === periode)

  const eleveIdsAbonnes = new Set(
    abonnements.filter((a) => a.type === 'cantine' && a.statut === 'actif').map((a) => String(a.eleve_id))
  )
  const elevesAbonnes = eleves.filter((e) => eleveIdsAbonnes.has(String(e.id)))
  const servisIds = new Set(scans.map((s) => String(s.eleve_id)))

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Service Cantine</h1>
      {error && <p className="error-banner">{error}</p>}{warning && <p className="scanner-abo-warning">{warning}</p>}

      <div className="cantine-menu-jour">
        <h2>Menu du jour — {PERIODE_LABELS[periode]}</h2>
        {menuDuJour ? (
          <>
            <p className="cantine-menu-libelle">{menuDuJour.libelle}</p>
            <p>{menuDuJour.description}</p>
          </>
        ) : (
          <p>Aucun menu renseigne pour cette periode aujourd'hui.</p>
        )}
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <p>
            {servisIds.size} / {elevesAbonnes.length} eleves servis aujourd'hui
          </p>
          <div className="module-table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Eleve</th>
                  <th>Classe</th>
                  <th>Statut</th>
                  {canMark && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {elevesAbonnes.map((e) => {
                  const servi = servisIds.has(String(e.id))
                  return (
                    <tr key={e.id}>
                      <td>
                        {e.nom} {e.prenom}
                      </td>
                      <td>{e.classe || '-'}</td>
                      <td>{servi ? 'Servi' : 'En attente'}</td>
                      {canMark && (
                        <td className="module-table-actions">
                          {!servi && (
                            <button type="button" className="btn-cantine" disabled={marking === e.id} onClick={() => marquerServi(e.id)}>
                              {marking === e.id ? 'Enregistrement...' : 'Marquer comme servi'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {elevesAbonnes.length === 0 && (
                  <tr>
                    <td colSpan={canMark ? 4 : 3}>Aucun eleve abonne a la cantine.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
