import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function CircuitDetail() {
  const { id } = useParams()
  const { can, accessLoading } = useAuth()
  const [circuit, setCircuit] = useState(null)
  const [etapes, setEtapes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ nom: '', ordre: '', heure_estimee: '' })
  const [saving, setSaving] = useState(false)

  const canCreateEtape = can('etapes', 'can_create')
  const canDeleteEtape = can('etapes', 'can_delete')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [circuitsRes, etapesRes] = await Promise.all([
        api.get('/crud.php?module=circuits'),
        can('etapes', 'can_read') ? api.get('/crud.php?module=etapes') : Promise.resolve({ data: [] }),
      ])
      const found = (circuitsRes.data || []).find((c) => String(c.id) === String(id))
      setCircuit(found || null)
      const mine = (etapesRes.data || [])
        .filter((e) => String(e.circuit_id) === String(id))
        .sort((a, b) => Number(a.ordre) - Number(b.ordre))
      setEtapes(mine)
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
  }, [id, accessLoading])

  async function addEtape(e) {
    e.preventDefault()
    if (!form.nom || !form.ordre) return
    setSaving(true)
    setError(null)
    try {
      await api.post('/crud.php?module=etapes', {
        circuit_id: id,
        nom: form.nom,
        ordre: Number(form.ordre),
        heure_estimee: form.heure_estimee || null,
        statut: 'active',
      })
      setForm({ nom: '', ordre: '', heure_estimee: '' })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeEtape(etapeId) {
    setError(null)
    try {
      await api.del('/crud.php?module=etapes', { id: etapeId })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!circuit) {
    return (
      <div className="page">
        <p>
          <Link to="/modules/circuits">&larr; Circuits</Link>
        </p>
        <p className="error-banner">Circuit introuvable ou acces non autorise.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <p>
        <Link to="/modules/circuits">&larr; Circuits</Link>
      </p>
      <h1>{circuit.nom}</h1>
      {error && <p className="error-banner">{error}</p>}
      <p>{circuit.description}</p>
      <p>Vehicule : {circuit.vehicule || '-'}</p>
      <p>Statut : {circuit.statut}</p>

      <h2>Etapes (ordre du trajet)</h2>
      {etapes.length === 0 && <p>Aucune etape definie pour ce circuit.</p>}
      {etapes.length > 0 && (
        <ol className="etapes-list">
          {etapes.map((e) => (
            <li key={e.id} className="etapes-list-item">
              <span className="etapes-list-nom">{e.nom}</span>
              {e.heure_estimee && <span className="etapes-list-heure">{e.heure_estimee}</span>}
              {canDeleteEtape && (
                <button type="button" className="etapes-list-remove" onClick={() => removeEtape(e.id)}>
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {canCreateEtape && (
        <form onSubmit={addEtape} className="module-form">
          <label className="module-form-field">
            <span>Nom de l'etape</span>
            <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          </label>
          <label className="module-form-field">
            <span>Ordre</span>
            <input
              type="number"
              min="1"
              value={form.ordre}
              onChange={(e) => setForm({ ...form, ordre: e.target.value })}
            />
          </label>
          <label className="module-form-field">
            <span>Heure estimee</span>
            <input
              type="time"
              value={form.heure_estimee}
              onChange={(e) => setForm({ ...form, heure_estimee: e.target.value })}
            />
          </label>
          <div className="module-form-actions">
            <button type="submit" className="btn-transport" disabled={saving}>
              {saving ? 'Ajout...' : "Ajouter l'etape"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
