import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const TYPE_LABELS = { recette: 'Recette', depense: 'Depense' }
const STATUT_LABELS = { en_attente: 'En attente', payee: 'Payee', en_retard: 'En retard', annulee: 'Annulee' }

export default function Finance() {
    const { can, accessLoading } = useAuth()
    const [eleves, setEleves] = useState([])
    const [entries, setEntries] = useState([])
    const [repartition, setRepartition] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [working, setWorking] = useState(null)

  const [newLibelle, setNewLibelle] = useState('')
    const [newMontant, setNewMontant] = useState('')
    const [newType, setNewType] = useState('recette')
    const [newEleveId, setNewEleveId] = useState('')
    const [newDateEcheance, setNewDateEcheance] = useState('')

  const [payerFor, setPayerFor] = useState(null)
    const [modePaiement, setModePaiement] = useState('')

  const [motifFor, setMotifFor] = useState(null)
    const [motifAction, setMotifAction] = useState(null)
    const [motifValue, setMotifValue] = useState('')

  const [historiqueFor, setHistoriqueFor] = useState(null)
    const [historique, setHistorique] = useState(null)

  const canCreate = can('finance', 'can_create')
    const canEdit = can('finance', 'can_edit')

  async function load() {
        setLoading(true)
        setError(null)
        try {
                const [elevesRes, entriesRes, repRes] = await Promise.all([
                          api.get('/crud.php?module=eleves'),
                          api.get('/crud.php?module=finance'),
                          api.get('/finance-action.php?repartition=1'),
                        ])
                setEleves(elevesRes.data || [])
                setEntries(entriesRes.data || [])
                setRepartition(repRes)
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
        if (!eleveId) return '-'
        const found = eleves.find((e) => String(e.id) === String(eleveId))
        return found ? `${found.nom} ${found.prenom}` : `Eleve #${eleveId}`
  }

  async function handleCreer(e) {
        e.preventDefault()
        if (!newLibelle || !newMontant) return
        setError(null)
        try {
          await api.post('/crud.php?module=finance', {
                    libelle: newLibelle,
                    montant: Number(newMontant),
                    type: newType,
                    eleve_id: newEleveId ? Number(newEleveId) : null,
                    date_echeance: newDateEcheance || null,
                    statut: 'en_attente',
          })
                setNewLibelle('')
                setNewMontant('')
                setNewEleveId('')
                setNewDateEcheance('')
                await load()
        } catch (err) {
                setError(err.message)
        }
  }

  async function runAction(financeId, action, extra) {
        setWorking(`${financeId}-${action}`)
        setError(null)
        try {
                await api.post('/finance-action.php', { finance_id: financeId, action, ...extra })
                await load()
        } catch (err) {
                setError(err.message)
        } finally {
                setWorking(null)
        }
  }

  function startPayer(id) {
        setPayerFor(id)
        setModePaiement('')
  }

  async function confirmPayer() {
        await runAction(payerFor, 'marquer_payee', { mode_paiement: modePaiement })
        setPayerFor(null)
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
                const res = await api.get(`/finance-action.php?finance_id=${id}`)
                setHistorique(res.data || [])
        } catch (err) {
                setError(err.message)
        }
  }

  return (
        <div className="page">
              <p>
                      <Link to="/">&larr; Tableau de bord </Link>
                            </p>
                            <h1>Finance </h1>
                              {error && <p className="error-banner">{error}</p>}
                              
                                {repartition && (
                  <div className="dashboard-stats">
                            <div className="dashboard-widget">
                                        <span className="dashboard-widget-value">{repartition.total_recettes}</span>
                                                    <span className="dashboard-widget-label">Total recettes </span>
                                                              </div>
                                                              <div className="dashboard-widget">
                                                                          <span className="dashboard-widget-value">{repartition.total_depenses}</span>
                                                                                      <span className="dashboard-widget-label">Total depenses </span>
                                                                                                </div>
                                                                                                <div className="dashboard-widget">
                                                                                                            <span className="dashboard-widget-value">{repartition.solde}</span>
                                                                                                                        <span className="dashboard-widget-label">Solde </span>
                                                                                                                                  </div>
                                                                                                                        
                                                                                                                          {repartition.par_statut && Object.keys(repartition.par_statut).map((s) => (
                                <div className="dashboard-widget" key={s}>
                                              <span className="dashboard-widget-value">{repartition.par_statut[s].count}</span>
                                                            <span className="dashboard-widget-label">{STATUT_LABELS[s] || s} ({repartition.par_statut[s].total})</span>
                                                                        </div>
                                                                      ))}
                                                                    </div>
                                                                  )}
                                                            
                                                              {canCreate && (
                                          <form onSubmit={handleCreer} className="module-form">
                                                    <h2>Nouvelle entree </h2>
                                                              <label className="module-form-field">
                                                                          <span>Libelle </span>
                                                                                      <input type="text" value={newLibelle} onChange={(e) => setNewLibelle(e.target.value)} required />
                                                                                    </label>
                                                                                    <label className="module-form-field">
                                                                                                <span>Montant </span>
                                                                                                            <input type="number" step="0.01" value={newMontant} onChange={(e) => setNewMontant(e.target.value)} required />
                                                                                                          </label>
                                                                                                
                                                                                                          <label className="module-form-field">
                                                                                                                      <span>Type </span>
                                                                                                                                  <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                                                                                                                                                <option value="recette">Recette </option>
                                                                                                                                                              <option value="depense">Depense </option>
                                                                                                                                                                          </select>
                                                                                                                                                                        </label>
                                                                                                                                                                        <label className="module-form-field">
                                <span>Eleve (facture, optionnel) </span>
                                            <select value={newEleveId} onChange={(e) => setNewEleveId(e.target.value)}>
                                                          <option value="">-- Aucun --</option>
                                                            {eleves.map((el) => (
                                                            <option key={el.id} value={el.id}>{el.nom} {el.prenom}</option>
                                                                          ))}
                                                                        </select>
                                                                      </label>
                                                                      <label className="module-form-field">
                                                                                  <span>Echeance </span>
                                                                                              <input type="date" value={newDateEcheance} onChange={(e) => setNewDateEcheance(e.target.value)} />
                                                                                            </label>
                                                                                            <div className="module-form-actions">
                                                                                                        <button type="submit">Creer </button>
                                                                                                                  </div>
                                                                                                                </form>
                                                                                                              )}
                                                                                                        
                                                                                                              <h2>Liste des entrees </h2>
                                                                                                                {loading ? (
                                                                      <p>Chargement...</p>
                                                                            ) : (
                                                                              <div className="module-table-wrap">
                                                                                        <table className="module-table">
                                                                                                    <thead>
                                                                                                                  <tr>
                                                                                                                                  <th>Libelle </th>
                                                                                                                                                  <th>Type </th>
                                                                                                                                                                  <th>Eleve </th>
                                                                                                                                                                                  <th>Montant </th>
                                                                                                                                                                                                  <th>Echeance </th>
                                                                                                                                                                                                                  <th>Statut </th>
                                                                                                                                                                                                                                  {canEdit && <th>Actions </th>}
                                                                                                                                                                                                                                                </tr>
                                                                                                                                                                                                                                              </thead>

                                                                                                                                                                                                                                                <tbody>
                                                                                                                                                                                                                                                              {entries.map((f) => (
                                                                                        <tr key={f.id}>
                                                                                                          <td>{f.libelle}</td>
                                                                                                                            <td>{TYPE_LABELS[f.type] || f.type}</td>
                                                                                                                                              <td>{eleveNom(f.eleve_id)}</td>
                                                                                                                                                                <td>{f.montant}</td>
                                                                                                                                                                                  <td>{f.date_echeance || '-'}</td>
                                                                                                                                                                                                    <td className={f.statut === 'en_retard' ? 'scanner-abo-warning' : ''}>{STATUT_LABELS[f.statut] || f.statut}</td>
                                                                                                                                                                                                                      {canEdit && (
                                                                                                              <td className="module-table-actions">
                                                                                                                {f.statut !== 'payee' && f.statut !== 'annulee' && (
                                                                                                                                        <button type="button" disabled={working === `${f.id}-marquer_payee`} onClick={() => startPayer(f.id)}>
                                                                                                                                                                  Marquer payee
                                                                                                                                                                </button>
                                                                                                                                                              )}
                                                                                                                                          {f.statut === 'en_attente' && (
                                                                                                                                                                  <button type="button" disabled={working === `${f.id}-marquer_en_retard`} onClick={() => runAction(f.id, 'marquer_en_retard')}>
                                                                                                                                                                                            En retard
                                                                                                                                                                                          </button>
                                                                                                                                                                                        )}
                                                                                                                                                                    {f.statut !== 'payee' && f.statut !== 'annulee' && (
                                                                                                                                                                                            <button type="button" disabled={working === `${f.id}-annuler`} onClick={() => startMotif(f.id, 'annuler')}>
                                                                                                                                                                                                                      Annuler
                                                                                                                                                                                                                    </button>
                                                                                                                                                                                                                  )}
                                                                                                                                                                                                                  {f.statut === 'annulee' && (
                                                                                                                                                                                                                      <button type="button" disabled={working === `${f.id}-reactiver`} onClick={() => runAction(f.id, 'reactiver')}>
                                                                                                                                                                                                                                                Reactiver
                                                                                                                                                                                                                                              </button>
                                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                                            <button type="button" onClick={() => openHistorique(f.id)}>
                                                                                                                                                                                                                                                                    Historique
                                                                                                                                                                                                                                                                  </button>
                                                                                                                                                                                                                                                                </td>
                                                                                                                                                                                                                                                              )}
                                                                                                                                                                                                                                                            </tr>
                                                                                                                                                                                                                                                          ))}
                                                                                                                                                                                                                                                          {entries.length === 0 && (
                                                                                                                                                                                                                                        <tr>
                                                                                                                                                                                                                                                          <td colSpan={canEdit ? 7 : 6}>Aucune entree.</td>
                                                                                                                                                                                                                                                                          </tr>
                                                                                                                                                                                                                                                                        )}
                                                                                                                                                                                                                                                                      </tbody>
                                                                                                                                                                                                                                                                    </table>
                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                )}

                                                                                                                                                                                                                                                                  {payerFor && (
                                                                                                                                                                                                                                                  <div className="module-form">
                                                                                                                                                                                                                                                            <h2>Marquer comme payee </h2>
                                                                                                                                                                                                                                                                      <label className="module-form-field">
                                                                                                                                                                                                                                                                                  <span>Mode de paiement (optionnel) </span>
                                                                                                                                                                                                                                                                                              <input type="text" value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} />
                                                                                                                                                                                                                                                                                            </label>
                                                                                                                                                                                                                                                                                            <div className="module-form-actions">
                                                                                                                                                                                                                                                                                                        <button type="button" onClick={confirmPayer}>Confirmer </button>
                                                                                                                                                                                                                                                                                                                    <button type="button" onClick={() => setPayerFor(null)}>Annuler </button>
                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                                                                                                          {motifFor && (
                                                                                                                                                                                                                                                            <div className="module-form">
                                                                                                                                                                                                                                                                      <h2>Annuler l'entree </h2>
                                                                                                                                                                                                                                                                                <label className="module-form-field">
                                                                                                                                                                                                                                                                                            <span>Motif (optionnel) </span>
                                                                                                                                                                                                                                                                                                        <input type="text" value={motifValue} onChange={(e) => setMotifValue(e.target.value)} />
                                                                                                                                                                                                                                                                                                      </label>
                                                                                                                                                                                                                                                                                                      <div className="module-form-actions">
                                                                                                                                                                                                                                                                                                                  <button type="button" onClick={confirmMotif}>Confirmer </button>
                                                                                                                                                                                                                                                                                                                              <button type="button" onClick={() => { setMotifFor(null); setMotifAction(null) }}>Annuler </button>
                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                    )}

                                                                                                                                                                                                                                                                                                                                      {historiqueFor && (
                                                                                                                                                                                                                                                                      <div className="module-form">
                                                                                                                                                                                                                                                                                <h2>Historique </h2>
                                                                                                                                                                                                                                                                                          {historique === null ? (
                                                                                                                                                                                                                                                                                    <p>Chargement...</p>
                                                                                                                                                                                                                                                                                              ) : historique.length === 0 ? (
                                                                                                                                                                                                                                                                                                <p>Aucun historique pour cette entree.</p>
                                                                                                                                                                                                                                                                                                          ) : (
                                                                                                                                                                                                                                                                                                            <ul>
                                                                                                                                                                                                                                                                                                                          {historique.map((h) => (
                                                                                                                                                                                                                                                                                                      <li key={h.id}>
                                                                                                                                                                                                                                                                                                                        {h.created_at} - {h.action} : {h.ancien_statut || '-'} vers {h.nouveau_statut}{h.motif ? ` (${h.motif})` : ''}{h.montant_paye ? ` - ${h.montant_paye}` : ''}
                                                                                                                                                                                                                                                                                                                      </li>
                                                                                                                                                                                                                                                                                                                    ))}
                                                                                                                                                                                                                                                                                                                  </ul>
                                                                                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                                                                                                <div className="module-form-actions">
                                                                                                                                                                                                                                                                                                                            <button type="button" onClick={() => setHistoriqueFor(null)}>Fermer </button>
                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                  )}
                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                                                                                                            }
                                                                                                  
