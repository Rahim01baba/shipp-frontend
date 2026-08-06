import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { MODULES } from '../config/modules.js'

/**
 * Page CRUD generique — pilotee par la config MODULES.
 * Un seul composant reutilise pour les 12 modules metier : liste + formulaire
 * d'ajout/edition + suppression, tous branches sur l'endpoint crud.php
 * cote API (parametre ?module=...).
 */

function emptyForm(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, '']))
}

export default function ModuleCrud() {
  const { moduleKey } = useParams()
  const moduleDef = MODULES.find((m) => m.key === moduleKey)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(moduleDef ? emptyForm(moduleDef.fields) : {})
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load(def) {
    if (!def) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.get(`/crud.php?module=${def.key}`)
      setRows(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setForm(moduleDef ? emptyForm(moduleDef.fields) : {})
    setEditingId(null)
    load(moduleDef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey])

  if (!moduleDef) {
    return (
      <div className="page">
        <p>Module inconnu.</p>
        <Link to="/">Retour au tableau de bord</Link>
      </div>
    )
  }

  function startEdit(row) {
    const next = {}
    moduleDef.fields.forEach((f) => {
      next[f.key] = row[f.key] ?? ''
    })
    setForm(next)
    setEditingId(row.id)
  }

  function cancelEdit() {
    setForm(emptyForm(moduleDef.fields))
    setEditingId(null)
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await api.put(`/crud.php?module=${moduleDef.key}`, { id: editingId, ...form })
      } else {
        await api.post(`/crud.php?module=${moduleDef.key}`, form)
      }
      cancelEdit()
      await load(moduleDef)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    setError(null)
    try {
      await api.del(`/crud.php?module=${moduleDef.key}`, { id })
      await load(moduleDef)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/">&larr; Tableau de bord</Link>
      </p>
      <h1>{moduleDef.label}</h1>
      {error && <p className="error-banner">{error}</p>}

      <form onSubmit={submit} className="module-form">
        {moduleDef.fields.map((f) => (
          <label key={f.key} className="module-form-field">
            <span>{f.label}</span>
            <input
              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
              value={form[f.key] ?? ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </label>
        ))}
        <div className="module-form-actions">
          <button type="submit" disabled={saving}>
            {editingId ? 'Mettre a jour' : 'Ajouter'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="module-table-wrap">
          <table className="module-table">
            <thead>
              <tr>
                {moduleDef.fields.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {moduleDef.fields.map((f) => (
                    <td key={f.key}>{row[f.key]}</td>
                  ))}
                  <td className="module-table-actions">
                    <button type="button" onClick={() => startEdit(row)}>
                      Modifier
                    </button>
                    <button type="button" onClick={() => remove(row.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={moduleDef.fields.length + 1}>Aucune donnee. Ajoutes-en une ci-dessus.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
