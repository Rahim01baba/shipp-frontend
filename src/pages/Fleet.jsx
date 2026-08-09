import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const TABS = [
  { key: 'jour', label: 'Vue du jour' },
  { key: 'disponibilites', label: 'Disponibilites' },
  { key: 'flotte', label: 'Flotte' },
  { key: 'historique', label: 'Historique' },
  { key: 'alertes', label: 'Alertes' },
  { key: 'carburant', label: 'Carburant', bientot: true },
  { key: 'kilometrage', label: 'Kilometrage', bientot: true },
]

export default function Fleet() {
  const { can, accessLoading } = useAuth()
  const canRead = can('affectations_chauffeur', 'can_read')
  const canEditAffect = can('affectations_chauffeur', 'can_edit')
  const canEditCouverture = can('couvertures_chauffeur', 'can_edit')

  const [tab, setTab] = useState('jour')
  const [vueDuJour, setVueDuJour] = useState({ data: [], kpis: {} })
  const [dispo, setDispo] = useState({ chauffeurs: [], vehicules: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acting, setActing] = useState(false)

  const [reaffectPanel, setReaffectPanel] = useState(null) // { circuit, type }
  const [reaffectValue, setReaffectValue] = useState('')

  const [couverturePanel, setCouverturePanel] = useState(null) // { circuit }
  const [couvertureForm, setCouvertureForm] = useState({
    chauffeur_remplacant_id: '',
    portee: 'circuit',
    eleve_ids: [],
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin: '',
    motif: '',
  })
  const [circuitEleves, setCircuitEleves] = useState([])

  const [historique, setHistorique] = useState([])
  const [historiqueUsers, setHistoriqueUsers] = useState([])
  const [historiqueLoading, setHistoriqueLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vueRes, dispoRes] = await Promise.all([
        api.get('/fleet-vue-du-jour.php'),
        api.get('/fleet-disponibilites.php'),
      ])
      setVueDuJour(vueRes)
      setDispo(dispoRes)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (accessLoading || !canRead) return
    load()
  }, [accessLoading, canRead, load])

  useEffect(() => {
    if (tab !== 'historique' || historiqueLoading || historique.length > 0) return
    async function loadHistorique() {
      setHistoriqueLoading(true)
      try {
        const [journalRes, usersRes] = await Promise.all([
          api.get('/crud.php?module=journal_activite'),
          api.get('/crud.php?module=utilisateurs'),
        ])
        const filtered = (journalRes.data || []).filter((e) =>
          ['circuits', 'affectations_chauffeur', 'couvertures_chauffeur'].includes(e.module_key)
        )
        setHistorique(filtered)
        setHistoriqueUsers(usersRes.data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setHistoriqueLoading(false)
      }
    }
    loadHistorique()
  }, [tab, historique.length, historiqueLoading])

  function userNom(id) {
    const u = historiqueUsers.find((x) => String(x.id) === String(id))
    return u ? u.name : '#' + id
  }

  function openReaffect(circuit, type) {
    setReaffectPanel({ circuit, type })
    setReaffectValue('')
  }

  async function submitReaffect(e) {
    e.preventDefault()
    if (!reaffectValue) return
    setActing(true)
    setError(null)
    try {
      await api.post('/fleet-reaffecter.php', {
        type: reaffectPanel.type,
        circuit_id: reaffectPanel.circuit.id,
        nouveau_id: Number(reaffectValue),
      })
      setReaffectPanel(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActing(false)
    }
  }

  async function openCouverture(circuit) {
    setCouverturePanel({ circuit })
    setCouvertureForm({
      chauffeur_remplacant_id: '',
      portee: 'circuit',
      eleve_ids: [],
      date_debut: new Date().toISOString().slice(0, 10),
      date_fin: '',
      motif: '',
    })
    try {
      const elevesRes = await api.get('/crud.php?module=eleves')
      setCircuitEleves((elevesRes.data || []).filter((el) => String(el.circuit_id) === String(circuit.id)))
    } catch (e) {
      setCircuitEleves([])
    }
  }

  function toggleEleve(id) {
    setCouvertureForm((f) => {
      const has = f.eleve_ids.includes(id)
      return { ...f, eleve_ids: has ? f.eleve_ids.filter((x) => x !== id) : [...f.eleve_ids, id] }
    })
  }

  async function submitCouverture(e) {
    e.preventDefault()
    if (!couvertureForm.chauffeur_remplacant_id || !couvertureForm.date_debut) return
    if (couvertureForm.portee === 'eleves' && couvertureForm.eleve_ids.length === 0) {
      setError('Selectionnez au moins un eleve pour une couverture partielle.')
      return
    }
    setActing(true)
    setError(null)
    try {
      await api.post('/fleet-declarer-couverture.php', {
        circuit_id: couverturePanel.circuit.id,
        chauffeur_remplacant_id: Number(couvertureForm.chauffeur_remplacant_id),
        portee: couvertureForm.portee,
        eleve_ids: couvertureForm.eleve_ids,
        date_debut: couvertureForm.date_debut,
        date_fin: couvertureForm.date_fin || null,
        motif: couvertureForm.motif || null,
      })
      setCouverturePanel(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActing(false)
    }
  }

  async function terminerCouverture(couverture) {
    setActing(true)
    setError(null)
    try {
      await api.put('/fleet-declarer-couverture.php', { id: couverture.id })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setActing(false)
    }
  }

  if (accessLoading || (loading && canRead)) {
    return (
      <div className="page">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!canRead) {
    return (
      <div className="page">
        <p>
          <Link to="/">&larr; Tableau de bord</Link>
        </p>
        <h1>Centre d'exploitation Fleet</h1>
        <p>Vous n'avez pas acces a ce module.</p>
      </div>
    )
  }

  const toutesLesCouvertures = vueDuJour.data.flatMap((c) => c.couvertures_actives.map((cv) => ({ ...cv, circuit_nom: c.nom })))

  const alertes = vueDuJour.data.filter((c) => c.statut === 'actif').flatMap((c) => {
    const items = []
    const aChauffeur = c.titulaire !== null || c.couvertures_actives.length > 0
    if (!aChauffeur) items.push({ circuit: c, type: 'Aucun chauffeur affecte' })
    if (!c.vehicule) items.push({ circuit: c, type: 'Aucun vehicule affecte' })
    if (c.vehicule && c.vehicule.statut !== 'actif') items.push({ circuit: c, type: 'Vehicule ' + c.vehicule.immatriculation + " n'est plus actif (" + c.vehicule.statut + ')' })
    return items
  })

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Centre d'exploitation Fleet</h1>
      {error && <p className="error-banner">{error}</p>}

      <div className="fleet-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.bientot && <span className="fleet-tab-soon"> (bientot)</span>}
          </button>
        ))}
      </div>

      {tab === 'jour' && (
        <>
          <div className="dashboard-widgets">
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{vueDuJour.kpis.circuits ?? 0}</span>
              <span className="dashboard-widget-label">Circuits</span>
            </div>
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{vueDuJour.kpis.circuits_couverts ?? 0}</span>
              <span className="dashboard-widget-label">Circuits couverts</span>
            </div>
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{vueDuJour.kpis.chauffeurs_affectes ?? 0}</span>
              <span className="dashboard-widget-label">Chauffeurs affectes</span>
            </div>
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{vueDuJour.kpis.vehicules_actifs ?? 0}</span>
              <span className="dashboard-widget-label">Vehicules actifs</span>
            </div>
            <div className="dashboard-widget">
              <span className="dashboard-widget-value">{vueDuJour.kpis.alertes ?? 0}</span>
              <span className="dashboard-widget-label">Alertes</span>
            </div>
          </div>

          {toutesLesCouvertures.length > 0 && (
            <div className="fleet-couvertures-banner">
              {toutesLesCouvertures.map((cv) => (
                <div key={cv.id} className="notification-card">
                  <div>
                    <div className="notification-titre">
                      {cv.circuit_nom} : {cv.remplacant_nom} couvre {cv.eleve_id ? 'un eleve' : 'tout le circuit'}
                    </div>
                    <div>
                      du {cv.date_debut} au {cv.date_fin || 'nouvel ordre'}
                      {cv.motif ? ' — ' + cv.motif : ''}
                    </div>
                  </div>
                  {canEditCouverture && (
                    <button type="button" className="btn-transport" disabled={acting} onClick={() => terminerCouverture(cv)}>
                      Terminer la couverture
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="module-table-wrap">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Circuit</th>
                  <th>Chauffeur titulaire</th>
                  <th>Vehicule</th>
                  <th>Trajet du jour</th>
                  {(canEditAffect || canEditCouverture) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vueDuJour.data.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{c.titulaire ? c.titulaire.chauffeur_nom : <em>aucun</em>}</td>
                    <td>{c.vehicule ? c.vehicule.immatriculation + ' (' + c.vehicule.modele + ')' : <em>aucun</em>}</td>
                    <td>{c.trajet_du_jour ? c.trajet_du_jour.statut : <em>pas de trajet</em>}</td>
                    {(canEditAffect || canEditCouverture) && (
                      <td className="module-table-actions">
                        {canEditAffect && (
                          <button type="button" className="btn-transport" onClick={() => openReaffect(c, 'chauffeur')}>
                            Changer le titulaire
                          </button>
                        )}
                        {canEditAffect && (
                          <button type="button" className="btn-transport" onClick={() => openReaffect(c, 'vehicule')}>
                            Changer le vehicule
                          </button>
                        )}
                        {canEditCouverture && (
                          <button type="button" className="btn-transport" onClick={() => openCouverture(c)}>
                            Declarer une couverture
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {vueDuJour.data.length === 0 && (
                  <tr>
                    <td colSpan={5}>Aucun circuit pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'disponibilites' && (
        <div className="fleet-dispo-grid">
          <div>
            <h2>Chauffeurs</h2>
            <div className="module-table-wrap">
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Etat</th>
                    <th>Sur circuit</th>
                  </tr>
                </thead>
                <tbody>
                  {dispo.chauffeurs.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.disponible ? 'Disponible' : c.occupation === 'titulaire' ? 'Titulaire' : 'En couverture'}</td>
                      <td>{c.circuit || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2>Vehicules</h2>
            <div className="module-table-wrap">
              <table className="module-table">
                <thead>
                  <tr>
                    <th>Immatriculation</th>
                    <th>Modele</th>
                    <th>Etat</th>
                    <th>Sur circuit</th>
                  </tr>
                </thead>
                <tbody>
                  {dispo.vehicules.map((v) => (
                    <tr key={v.id}>
                      <td>{v.immatriculation}</td>
                      <td>{v.modele}</td>
                      <td>{v.disponible ? 'Disponible' : v.statut !== 'actif' ? v.statut : 'Occupe'}</td>
                      <td>{v.circuit || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'flotte' && (
        <div>
          <p>La gestion complete des vehicules (creation, modification, export) se trouve dans le module Vehicules.</p>
          <Link to="/modules/vehicules" className="module-link">
            Ouvrir le module Vehicules
          </Link>
        </div>
      )}

      {tab === 'historique' && (
        <div className="module-table-wrap">
          {historiqueLoading ? (
            <p>Chargement...</p>
          ) : (
            <table className="module-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((h) => (
                  <tr key={h.id}>
                    <td>{h.created_at}</td>
                    <td>{userNom(h.user_id)}</td>
                    <td>{h.action}</td>
                    <td>{h.details}</td>
                  </tr>
                ))}
                {historique.length === 0 && (
                  <tr>
                    <td colSpan={4}>Aucune entree pour la flotte.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'alertes' && (
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Circuit</th>
                <th>Alerte</th>
              </tr>
            </thead>
            <tbody>
              {alertes.map((a, i) => (
                <tr key={i}>
                  <td>{a.circuit.nom}</td>
                  <td>{a.type}</td>
                </tr>
              ))}
              {alertes.length === 0 && (
                <tr>
                  <td colSpan={2}>Aucune alerte.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'carburant' || tab === 'kilometrage') && (
        <p>Ce module arrive bientot.</p>
      )}

      {reaffectPanel && (
        <div className="fleet-panel">
          <h2>
            {reaffectPanel.type === 'chauffeur' ? 'Changer le titulaire' : 'Reaffecter le vehicule'} — {reaffectPanel.circuit.nom}
          </h2>
          <form onSubmit={submitReaffect} className="module-form">
            <label className="module-form-field">
              <span>{reaffectPanel.type === 'chauffeur' ? 'Nouveau chauffeur' : 'Nouveau vehicule'}</span>
              <select value={reaffectValue} onChange={(e) => setReaffectValue(e.target.value)}>
                <option value="">-- Choisir --</option>
                {reaffectPanel.type === 'chauffeur'
                  ? dispo.chauffeurs.filter((c) => c.disponible).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  : dispo.vehicules.filter((v) => v.disponible).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.immatriculation} ({v.modele})
                      </option>
                    ))}
              </select>
            </label>
            <div className="module-form-actions">
              <button type="submit" className="btn-transport" disabled={acting || !reaffectValue}>
                Confirmer
              </button>
              <button type="button" onClick={() => setReaffectPanel(null)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {couverturePanel && (
        <div className="fleet-panel">
          <h2>Declarer une couverture — {couverturePanel.circuit.nom}</h2>
          <form onSubmit={submitCouverture} className="module-form fleet-couverture-form">
            <label className="module-form-field">
              <span>Chauffeur remplacant</span>
              <select
                value={couvertureForm.chauffeur_remplacant_id}
                onChange={(e) => setCouvertureForm({ ...couvertureForm, chauffeur_remplacant_id: e.target.value })}
              >
                <option value="">-- Choisir --</option>
                {dispo.chauffeurs.filter((c) => c.disponible).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="module-form-field">
              <span>Portee</span>
              <select
                value={couvertureForm.portee}
                onChange={(e) => setCouvertureForm({ ...couvertureForm, portee: e.target.value })}
              >
                <option value="circuit">Tout le circuit</option>
                <option value="eleves">Eleves precis</option>
              </select>
            </label>

            <label className="module-form-field">
              <span>Date de debut</span>
              <input
                type="date"
                value={couvertureForm.date_debut}
                onChange={(e) => setCouvertureForm({ ...couvertureForm, date_debut: e.target.value })}
              />
            </label>

            <label className="module-form-field">
              <span>Date de fin (optionnel)</span>
              <input
                type="date"
                value={couvertureForm.date_fin}
                onChange={(e) => setCouvertureForm({ ...couvertureForm, date_fin: e.target.value })}
              />
            </label>

            <label className="module-form-field">
              <span>Motif (optionnel)</span>
              <input
                type="text"
                value={couvertureForm.motif}
                onChange={(e) => setCouvertureForm({ ...couvertureForm, motif: e.target.value })}
              />
            </label>

            {couvertureForm.portee === 'eleves' && (
              <div className="fleet-eleves-checklist">
                {circuitEleves.length === 0 && <p>Aucun eleve sur ce circuit.</p>}
                {circuitEleves.map((el) => (
                  <label key={el.id} className="fleet-eleve-check">
                    <input
                      type="checkbox"
                      checked={couvertureForm.eleve_ids.includes(el.id)}
                      onChange={() => toggleEleve(el.id)}
                    />
                    {el.nom} {el.prenom}
                  </label>
                ))}
              </div>
            )}

            <div className="module-form-actions">
              <button type="submit" className="btn-transport" disabled={acting}>
                Confirmer
              </button>
              <button type="button" onClick={() => setCouverturePanel(null)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

