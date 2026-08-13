import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const TYPE_LABELS = { transport: 'Transport', cantine: 'Cantine' }
const STATUT_LABELS = { actif: 'Actif', suspendu: 'Suspendu', en_attente: 'En attente', resilie: 'Resilie' }

export default function Abonnements() {
  const { can, accessLoading } = useAuth()
  const [eleves, setEleves] = useState([])
  const [abonnements, setAbonnements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [working, setWorking] = useState(null)

const [newEleveId, setNewEleveId] = useState('')
  const [newType, setNewType] = useState('transport')
  const [newDateDebut, setNewDateDebut] = useState('')
  const [newDateFin, setNewDateFin] = useState('')

const [renewFor, setRenewFor] = useState(null)
  const [renewDateFin, setRenewDateFin] = useState('')

const [motifFor, setMotifFor] = useState(null)
  const [motifAction, setMotifAction] = useState(null)
  const [motifValue, setMotifValue] = useState('')

const [historiqueFor, setHistoriqueFor] = useState(null)
  const [historique, setHistorique] = useState(null)

const canCreate = can('abonnements', 'can_create')
  const canEdit = can('abonnements', 'can_edit')

async function load() {
  setLoading(true)
  setError(null)
  try {
    const [elevesRes, abosRes] = await Promise.all([
      api.get('/crud.php?module=eleves'),
      api.get('/crud.php?module=abonnements'),
      ])
    setEleves(elevesRes.data || [])
    setAbonnements(abosRes.data || [])
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

function eleveNom(eleveId) {
  const found = eleves.find((e) => String(e.id) === String(eleveId))
  return found ? `${found.nom} ${found.prenom}` : `Eleve #${eleveId}`
}

async function handleSouscrire(e) {
  e.preventDefault()
  if (!newEleveId) return
  setError(null)
  try {
    await api.post('/abonnement-action.php', {
      action: 'souscrire',
      eleve_id: Number(newEleveId),
      type: newType,
      date_debut: newDateDebut || null,
      date_fin: newDateFin || null,
    })
    setNewEleveId('')
    setNewDateDebut('')
    setNewDateFin('')
    await load()
  } catch (err) {
    setError(err.message)
  }
}

async function runAction(abonnementId, action, extra) {
  setWorking(`${abonnementId}-${action}`)
  setError(null)
  try {
    await api.post('/abonnement-action.php', { abonnement_id: abonnementId, action, ...extra })
    await load()
  } catch (err) {
    setError(err.message)
  } finally {
    setWorking(null)
  }
}

function startRenew(id) {
  setRenewFor(id)
  setRenewDateFin('')
}

async function confirmRenew() {
  if (!renewDateFin) return
  await runAction(renewFor, 'renouveler', { date_fin: renewDateFin })
  setRenewFor(null)
}

function startMotif(id, action) {
  setMotifFor(id)
  setMotifAction(action)
  setMotifValue('')
}

async function confirmMotif() {
  await runAction(motifFor, motifAction, { motif: motifValue })
  setMotifFor(null)
  setMotifAction(null)
}

async function openHistorique(id) {
  setHistoriqueFor(id)
  setHistorique(null)
  try {
    const res = await api.get(`/abonnement-action.php?abonnement_id=${id}`)
    setHistorique(res.data || [])
  } catch (err) {
    setError(err.message)
  }
}

return (
  <div className="page">
  <p>
  <Link to="/">&larr; Tableau de bord</Link>
  </p>
  <h1>Abonnements</h1>
    {error && <p className="error-banner">{error}</p>}
    
      {canCreate && (
    <form onSubmit={handleSouscrire} className="module-form">
    <h2>Nouvelle souscription</h2>
    <label className="module-form-field">
    <span>Eleve</span>
    <select value={newEleveId} onChange={(e) => setNewEleveId(e.target.value)} required>
    <option value="">-- Choisir --</option>
      {eleves.map((e) => (
      <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
      ))}
      </select>
      </label>
      <label className="module-form-field">
      <span>Type</span>
      <select value={newType} onChange={(e) => setNewType(e.target.value)}>
      <option value="transport">Transport</option>
      <option value="cantine">Cantine</option>
      </select>
      </label>
      <label className="module-form-field">
      <span>Date de debut</span>
      <input type="date" value={newDateDebut} onChange={(e) => setNewDateDebut(e.target.value)} />
      </label>
      <label className="module-form-field">
      <span>Date de fin</span>
      <input type="date" value={newDateFin} onChange={(e) => setNewDateFin(e.target.value)} />
      </label>
      <div className="module-form-actions">
      <button type="submit">Souscrire</button>
      </div>
      </form>
      )}
      
      <h2>Liste des abonnements</h2>
        {loading ? (
        <p>Chargement...</p>
        ) : (
        <div className="module-table-wrap">
        <table className="module-table">
        <thead>
        <tr>
        <th>Eleve</th>
        <th>Type</th>
        <th>Statut</th>
        <th>Debut</th>
        <th>Fin</th>
          {canEdit && <th>Actions</th>}
          </tr>
          </thead>
          <tbody>
            {abonnements.map((a) => (
          <tr key={a.id}>
          <td>{eleveNom(a.eleve_id)}</td>
          <td>{TYPE_LABELS[a.type] || a.type}</td>
          <td className={a.statut !== 'actif' ? 'scanner-abo-warning' : ''}>{STATUT_LABELS[a.statut] || a.statut}</td>
          <td>{a.date_debut || '-'}</td>
          <td>{a.date_fin || '-'}</td>
            {canEdit && (
            <td className="module-table-actions">
              {a.statut !== 'resilie' && (
              <button type="button" disabled={working === `${a.id}-renouveler`} onClick={() => startRenew(a.id)}>
              Renouveler
              </button>
              )}
                {a.statut === 'actif' && (
                <button type="button" disabled={working === `${a.id}-suspendre`} onClick={() => startMotif(a.id, 'suspendre')}>
                Suspendre
                </button>
                )}
                  {a.statut === 'suspendu' && (
                  <button type="button" disabled={working === `${a.id}-reactiver`} onClick={() => runAction(a.id, 'reactiver')}>
                  Reactiver
                  </button>
                  )}
                    {a.statut !== 'resilie' && (
                    <button type="button" disabled={working === `${a.id}-resilier`} onClick={() => startMotif(a.id, 'resilier')}>
                    Resilier
                    </button>
                    )}
                    <button type="button" onClick={() => openHistorique(a.id)}>
                    Historique
                    </button>
                    </td>
                    )}
                    </tr>
                    ))}
                      {abonnements.length === 0 && (
                      <tr>
                      <td colSpan={canEdit ? 6 : 5}>Aucun abonnement.</td>
                      </tr>
                      )}
                      </tbody>
                      </table>
                      </div>
                      )}
                      
                        {renewFor && (
                        <div className="module-form">
                        <h2>Renouveler l'abonnement</h2>
                        <label className="module-form-field">
                        <span>Nouvelle date de fin</span>
                        <input type="date" value={renewDateFin} onChange={(e) => setRenewDateFin(e.target.value)} required />
                        </label>
                        <div className="module-form-actions">
                        <button type="button" onClick={confirmRenew}>Confirmer</button>
                        <button type="button" onClick={() => setRenewFor(null)}>Annuler</button>
                        </div>
                        </div>
                        )}
                        
                          {motifFor && (
                          <div className="module-form">
                          <h2>{motifAction === 'suspendre' ? 'Suspendre' : 'Resilier'} l'abonnement</h2>
                          <label className="module-form-field">
                          <span>Motif (optionnel)</span>
                          <input type="text" value={motifValue} onChange={(e) => setMotifValue(e.target.value)} />
                          </label>
                          <div className="module-form-actions">
                          <button type="button" onClick={confirmMotif}>Confirmer</button>
                          <button type="button" onClick={() => { setMotifFor(null); setMotifAction(null) }}>Annuler</button>
                          </div>
                          </div>
                          )}
                          
                            {historiqueFor && (
                            <div className="module-form">
                            <h2>Historique</h2>
                              {historique === null ? (
                              <p>Chargement...</p>
                              ) : historique.length === 0 ? (
                              <p>Aucun historique pour cet abonnement.</p>
                              ) : (
                              <ul>
                                {historique.map((h) => (
                                <li key={h.id}>
                                  {h.created_at} - {h.action} : {h.ancien_statut || '-'} vers {h.nouveau_statut}{h.motif ? ` (${h.motif})` : ''}
                                </li>
                                ))}
                                </ul>
                                )}
                                <div className="module-form-actions">
                                <button type="button" onClick={() => setHistoriqueFor(null)}>Fermer</button>
                                </div>
                                </div>
                                )}
                                </div>
                                )
                                  }
                                </div>
