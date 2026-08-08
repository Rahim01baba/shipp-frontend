import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

const STATUT_LABELS = {
  active: 'Active',
  archivee: 'Archivee',
}

export default function AnneesScolaires() {
  const [annees, setAnnees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ libelle: '', date_debut: '', date_fin: '' })
  const [archiving, setArchiving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/crud.php?module=annees_scolaires')
      setAnnees(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function archiverEtOuvrir(e) {
    e.preventDefault()
    if (!form.libelle || !form.date_debut || !form.date_fin) return
    setArchiving(true)
    setError(null)
    try {
      const token = localStorage.getItem('shipp_token')
      const API_URL = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API_URL}/annee-archiver.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Erreur lors de l'archivage")
      setForm({ libelle: '', date_debut: '', date_fin: '' })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>Annees scolaires</h1>
      {error && <p className="error-banner">{error}</p>}

      <form onSubmit={archiverEtOuvrir} className="module-form">
        <label className="module-form-field">
          <span>Libelle (ex: 2027-2028)</span>
          <input
            type="text"
            value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          />
        </label>
        <label className="module-form-field">
          <span>Date de debut</span>
          <input
            type="date"
            value={form.date_debut}
            onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
          />
        </label>
        <label className="module-form-field">
          <span>Date de fin</span>
          <input
            type="date"
            value={form.date_fin}
            onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
          />
        </label>
        <div className="module-form-actions">
          <button type="submit" disabled={archiving}>
            {archiving ? 'Traitement...' : "Archiver l'annee active et ouvrir celle-ci"}
          </button>
        </div>
      </form>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                <th>Libelle</th>
                <th>Debut</th>
                <th>Fin</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {annees.map((a) => (
                <tr key={a.id}>
                  <td>{a.libelle}</td>
                  <td>{a.date_debut}</td>
                  <td>{a.date_fin}</td>
                  <td>{STATUT_LABELS[a.statut] || a.statut}</td>
                </tr>
              ))}
              {annees.length === 0 && (
                <tr>
                  <td colSpan={4}>Aucune annee scolaire.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
