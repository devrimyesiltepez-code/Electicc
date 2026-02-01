const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const PASSWORD_KEY = 'electricc_password'

export function getPassword(): string | null {
  return localStorage.getItem(PASSWORD_KEY)
}

export function setPassword(value: string) {
  localStorage.setItem(PASSWORD_KEY, value)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const password = getPassword()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (password) {
    headers.set('X-Auth-Token', password)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  return response.json() as Promise<T>
}

export const api = {
  getCustomers: () => request('/customers'),
  getProjects: () => request('/projects'),
  getProject: (id: number) => request(`/projects/${id}`),
  createTask: (projectId: number, payload: unknown) =>
    request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createFileLink: (projectId: number, payload: unknown) =>
    request(`/projects/${projectId}/file-links`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createRevision: (projectId: number, payload: unknown) =>
    request(`/projects/${projectId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
