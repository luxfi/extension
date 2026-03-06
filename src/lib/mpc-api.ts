// MPC API client for the Lux Wallet extension.
// Connects to the MPC backend at mpc.lux.network for transaction approval.

const MPC_API_BASE = 'https://mpc.lux.network/api/v1'

function getToken(): string | null {
  // Token is stored by the extension after OIDC login
  return localStorage.getItem('mpc_token')
}

function setToken(token: string) {
  localStorage.setItem('mpc_token', token)
  // Sync to background service worker for polling
  chrome.runtime?.sendMessage?.({ type: 'mpc_token_set', token }).catch(() => {})
}

function clearToken() {
  localStorage.removeItem('mpc_token')
  chrome.runtime?.sendMessage?.({ type: 'mpc_token_clear' }).catch(() => {})
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${MPC_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (res.status === 401) {
    clearToken()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }

  return res.json()
}

export interface Transaction {
  id: string
  wallet_id: string
  chain: string
  to_address: string
  amount: string
  status: string
  initiated_by: string
  approved_by: string[]
  created_at: string
}

export interface WebAuthnCredential {
  id: string
  device_name: string | null
  created_at: string
}

export const mpcApi = {
  setToken,
  getToken,
  clearToken,

  isAuthenticated(): boolean {
    return !!getToken()
  },

  // Exchange OIDC token for MPC JWT
  async exchangeOIDC(accessToken: string, issuer: string): Promise<{ token: string }> {
    const res = await fetch(`${MPC_API_BASE}/auth/oidc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, issuer }),
    })
    if (!res.ok) throw new Error('OIDC exchange failed')
    const data = await res.json()
    setToken(data.token)
    return data
  },

  // Transactions
  async listTransactions(): Promise<Transaction[]> {
    return apiFetch('/transactions')
  },

  async getTransaction(id: string): Promise<Transaction> {
    return apiFetch(`/transactions/${id}`)
  },

  async approveTransaction(id: string): Promise<{ status: string }> {
    return apiFetch(`/transactions/${id}/approve`, { method: 'POST' })
  },

  async rejectTransaction(id: string): Promise<{ status: string }> {
    return apiFetch(`/transactions/${id}/reject`, { method: 'POST' })
  },

  // WebAuthn biometric
  async webauthnRegisterBegin(): Promise<any> {
    return apiFetch('/webauthn/register/begin', { method: 'POST' })
  },

  async webauthnRegisterComplete(data: any): Promise<any> {
    return apiFetch('/webauthn/register/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async webauthnVerify(txId: string, assertion: any): Promise<any> {
    return apiFetch('/webauthn/verify', {
      method: 'POST',
      body: JSON.stringify({ tx_id: txId, ...assertion }),
    })
  },

  async listWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
    return apiFetch('/webauthn/credentials')
  },

  async deleteWebAuthnCredential(id: string): Promise<void> {
    await apiFetch(`/webauthn/credentials/${id}`, { method: 'DELETE' })
  },

  // Status
  async getStatus(): Promise<any> {
    return apiFetch('/status')
  },
}
