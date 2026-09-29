export interface PortfolioUser {
  id: string
  username: string
  role: 'admin' | 'user'
  active: boolean
  mustChangePassword: boolean
}

export class PortfolioApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code)
  }
}

export class PortfolioAuthClient {
  constructor(private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {}

  private async request<T>(path: string, method = 'GET', data?: object): Promise<T> {
    const response = await this.fetcher(path, {
      method,
      credentials: 'same-origin',
      ...(method === 'GET' ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null
      throw new PortfolioApiError(response.status, body?.error ?? 'request_failed')
    }
    return response.json() as Promise<T>
  }

  setupStatus(): Promise<{ required: boolean }> {
    return this.request('/api/setup/status')
  }

  async session(): Promise<PortfolioUser | null> {
    try {
      return (await this.request<{ user: PortfolioUser }>('/api/auth/session')).user
    } catch (error) {
      if (error instanceof PortfolioApiError && error.status === 401) return null
      throw error
    }
  }

  setup(code: string, username: string, password: string): Promise<{ user: PortfolioUser }> {
    return this.request('/api/setup', 'POST', { code, username, password })
  }

  login(username: string, password: string): Promise<{ user: PortfolioUser }> {
    return this.request('/api/auth/login', 'POST', { username, password })
  }

  logout(): Promise<{ ok: boolean }> {
    return this.request('/api/auth/logout', 'POST')
  }

  changePassword(password: string): Promise<{ user: PortfolioUser }> {
    return this.request('/api/auth/change-password', 'POST', { password })
  }

  listUsers(): Promise<{ users: PortfolioUser[] }> {
    return this.request('/api/admin/users')
  }

  createUser(username: string, password: string, role: 'admin' | 'user'): Promise<{ user: PortfolioUser }> {
    return this.request('/api/admin/users', 'POST', { username, password, role })
  }

  resetPassword(id: string, password: string): Promise<{ ok: boolean }> {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/reset-password`, 'POST', { password })
  }

  deactivateUser(id: string): Promise<{ ok: boolean }> {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/deactivate`, 'POST')
  }
}
