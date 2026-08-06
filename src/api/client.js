const API_URL = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('shipp_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('shipp_token', token)
  else localStorage.removeItem('shipp_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    setToken(null)
  }

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null

  if (!res.ok) {
    const message = data?.message || `Erreur API (${res.status})`
    throw new Error(message)
  }

  return data
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path, body) => request(path, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) })
}
