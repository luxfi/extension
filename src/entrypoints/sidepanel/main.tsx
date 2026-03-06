import React, { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { mpcApi, type Transaction } from '@/lib/mpc-api'
import { isWebAuthnSupported, startAuthentication, startRegistration } from '@/lib/webauthn'

type Tab = 'wallet' | 'approvals' | 'devices'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_approval: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    signed: '#3b82f6',
    broadcast: '#8b5cf6',
  }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: 600,
      background: `${colors[status] || '#6b7280'}20`,
      color: colors[status] || '#6b7280',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [token, setTokenInput] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (!token.trim()) return
    mpcApi.setToken(token.trim())
    onLogin()
  }

  const handleOIDC = async () => {
    // Open Lux ID in a new tab for OAuth
    const clientId = 'lux-mpc'
    const redirectUri = chrome.runtime.getURL('/sidepanel.html')
    const authUrl = `https://lux.id/oauth/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid profile email`
    chrome.tabs.create({ url: authUrl })
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{
          width: '56px', height: '56px', margin: '0 auto 12px',
          background: '#000', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <polygon points="24,8 40,40 8,40" fill="white" />
          </svg>
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>MPC Signing</h2>
        <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
          Approve transactions with biometrics
        </p>
      </div>

      <button onClick={handleOIDC} style={{
        padding: '12px 20px', fontSize: '14px', fontWeight: 500,
        background: '#000', color: '#fff', border: 'none',
        borderRadius: '10px', cursor: 'pointer',
      }}>
        Sign in with Lux ID
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
        <div style={{ flex: 1, height: '1px', background: 'currentColor' }} />
        <span style={{ fontSize: '12px' }}>or paste token</span>
        <div style={{ flex: 1, height: '1px', background: 'currentColor' }} />
      </div>

      <input
        type="password"
        placeholder="MPC API Token"
        value={token}
        onChange={e => { setTokenInput(e.target.value); setError('') }}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        style={{
          padding: '10px 12px', fontSize: '14px',
          border: '1px solid rgba(128,128,128,0.3)', borderRadius: '8px',
          background: 'transparent', color: 'inherit',
        }}
      />
      {error && <p style={{ color: '#ef4444', fontSize: '12px' }}>{error}</p>}
      <button onClick={handleLogin} style={{
        padding: '10px 20px', fontSize: '14px', fontWeight: 500,
        background: 'transparent', color: 'inherit',
        border: '1px solid rgba(128,128,128,0.3)', borderRadius: '10px',
        cursor: 'pointer', opacity: 0.8,
      }}>
        Connect
      </button>
    </div>
  )
}

function ApprovalsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState<string | null>(null)
  const hasWebAuthn = isWebAuthnSupported()

  const loadTx = useCallback(async () => {
    try {
      setLoading(true)
      const txs = await mpcApi.listTransactions()
      setTransactions(txs.filter((t: Transaction) =>
        t.status === 'pending_approval' || t.status === 'approved'
      ))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTx() }, [loadTx])

  const handleApprove = async (tx: Transaction) => {
    setApproving(tx.id)
    try {
      await mpcApi.approveTransaction(tx.id)
      await loadTx()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setApproving(null)
    }
  }

  const handleBiometricApprove = async (tx: Transaction) => {
    setApproving(tx.id)
    try {
      const assertion = await startAuthentication(tx.id)
      await mpcApi.webauthnVerify(tx.id, assertion)
      await loadTx()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async (tx: Transaction) => {
    setApproving(tx.id)
    try {
      await mpcApi.rejectTransaction(tx.id)
      await loadTx()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setApproving(null)
    }
  }

  if (loading) return <p style={{ padding: '24px', opacity: 0.5, textAlign: 'center' }}>Loading...</p>
  if (error) return <p style={{ padding: '24px', color: '#ef4444', textAlign: 'center' }}>{error}</p>

  if (transactions.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', opacity: 0.5 }}>
        <p style={{ fontSize: '32px', marginBottom: '8px' }}>&#10003;</p>
        <p>No pending approvals</p>
        <button onClick={loadTx} style={{
          marginTop: '16px', padding: '8px 16px', fontSize: '12px',
          background: 'transparent', color: 'inherit', border: '1px solid rgba(128,128,128,0.3)',
          borderRadius: '8px', cursor: 'pointer',
        }}>Refresh</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{transactions.length} pending</span>
        <button onClick={loadTx} style={{
          padding: '4px 10px', fontSize: '11px', background: 'transparent',
          color: 'inherit', border: '1px solid rgba(128,128,128,0.2)',
          borderRadius: '6px', cursor: 'pointer',
        }}>Refresh</button>
      </div>
      {transactions.map(tx => (
        <div key={tx.id} style={{
          padding: '12px', marginBottom: '8px',
          border: '1px solid rgba(128,128,128,0.15)', borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}>
              {tx.chain}
            </span>
            <StatusBadge status={tx.status} />
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>
            To: <span style={{ fontFamily: 'monospace' }}>{tx.to_address?.slice(0, 10)}...{tx.to_address?.slice(-6)}</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
            {tx.amount} {tx.chain}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.5, marginBottom: '8px' }}>
            Approvals: {tx.approved_by?.length || 0}
          </div>
          {tx.status === 'pending_approval' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {hasWebAuthn && (
                <button
                  onClick={() => handleBiometricApprove(tx)}
                  disabled={approving === tx.id}
                  style={{
                    flex: 1, padding: '8px', fontSize: '12px', fontWeight: 600,
                    background: '#000', color: '#fff', border: 'none',
                    borderRadius: '8px', cursor: 'pointer',
                    opacity: approving === tx.id ? 0.5 : 1,
                  }}
                >
                  {approving === tx.id ? '...' : 'Approve (Biometric)'}
                </button>
              )}
              <button
                onClick={() => handleApprove(tx)}
                disabled={approving === tx.id}
                style={{
                  flex: hasWebAuthn ? 0 : 1,
                  padding: '8px 12px', fontSize: '12px', fontWeight: 500,
                  background: 'transparent', color: 'inherit',
                  border: '1px solid rgba(128,128,128,0.3)', borderRadius: '8px',
                  cursor: 'pointer', opacity: approving === tx.id ? 0.5 : 1,
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(tx)}
                disabled={approving === tx.id}
                style={{
                  padding: '8px 12px', fontSize: '12px', fontWeight: 500,
                  background: 'transparent', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DevicesTab() {
  const [credentials, setCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const hasWebAuthn = isWebAuthnSupported()

  const loadCreds = useCallback(async () => {
    try {
      setLoading(true)
      const creds = await mpcApi.listWebAuthnCredentials()
      setCredentials(creds)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCreds() }, [loadCreds])

  const handleRegister = async () => {
    if (!hasWebAuthn) return
    setRegistering(true)
    setError('')
    try {
      const options = await mpcApi.webauthnRegisterBegin()
      const result = await startRegistration(options)
      result.device_name = deviceName || navigator.userAgent.split(' ').slice(-1)[0]
      await mpcApi.webauthnRegisterComplete(result)
      setDeviceName('')
      await loadCreds()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await mpcApi.deleteWebAuthnCredential(id)
      await loadCreds()
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (!hasWebAuthn) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', opacity: 0.6 }}>
        <p>WebAuthn is not supported in this browser.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ padding: '12px', border: '1px solid rgba(128,128,128,0.15)', borderRadius: '10px', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Register Device</p>
        <input
          type="text"
          placeholder="Device name (optional)"
          value={deviceName}
          onChange={e => setDeviceName(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', fontSize: '13px',
            border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px',
            background: 'transparent', color: 'inherit', marginBottom: '8px',
          }}
        />
        <button
          onClick={handleRegister}
          disabled={registering}
          style={{
            width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600,
            background: '#000', color: '#fff', border: 'none',
            borderRadius: '8px', cursor: 'pointer',
            opacity: registering ? 0.5 : 1,
          }}
        >
          {registering ? 'Waiting for biometric...' : 'Register Face ID / Touch ID'}
        </button>
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '12px', padding: '4px', marginBottom: '8px' }}>{error}</p>}
      {loading ? (
        <p style={{ textAlign: 'center', opacity: 0.5, padding: '16px' }}>Loading...</p>
      ) : credentials.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: 0.5, padding: '16px', fontSize: '13px' }}>
          No devices registered. Register one to approve transactions with biometrics.
        </p>
      ) : (
        credentials.map(cred => (
          <div key={cred.id} style={{
            padding: '10px 12px', marginBottom: '6px',
            border: '1px solid rgba(128,128,128,0.15)', borderRadius: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500 }}>{cred.device_name || 'Unnamed device'}</p>
              <p style={{ fontSize: '11px', opacity: 0.5 }}>{cred.id.slice(0, 12)}...</p>
            </div>
            <button
              onClick={() => handleDelete(cred.id)}
              style={{
                padding: '4px 10px', fontSize: '11px',
                background: 'transparent', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  )
}

function WalletTab() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '64px', height: '64px',
        background: '#000', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <polygon points="24,8 40,40 8,40" fill="white" />
        </svg>
      </div>
      <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Lux Wallet</h1>
      <p style={{ fontSize: '13px', opacity: 0.6, textAlign: 'center' }}>
        Multi-chain crypto wallet for the Lux ecosystem
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '260px', marginTop: '8px' }}>
        <button style={{
          padding: '12px 20px', fontSize: '15px', fontWeight: 500,
          background: '#000', color: '#fff', border: 'none',
          borderRadius: '10px', cursor: 'pointer',
        }}>Create Wallet</button>
        <button style={{
          padding: '12px 20px', fontSize: '15px', fontWeight: 500,
          background: 'transparent', color: 'inherit',
          border: '1px solid currentColor', borderRadius: '10px',
          cursor: 'pointer', opacity: 0.8,
        }}>Import Wallet</button>
      </div>
    </div>
  )
}

function App() {
  const [authenticated, setAuthenticated] = useState(mpcApi.isAuthenticated())
  const [tab, setTab] = useState<Tab>('approvals')

  // Check for OIDC callback token in URL hash
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token')
    if (accessToken) {
      mpcApi.exchangeOIDC(accessToken, 'https://lux.id')
        .then(() => setAuthenticated(true))
        .catch(() => {})
      window.location.hash = ''
    }
  }, [])

  const handleLogout = () => {
    mpcApi.clearToken()
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'wallet', label: 'Wallet' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'devices', label: 'Devices' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(128,128,128,0.15)',
        padding: '0 8px',
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 8px', fontSize: '13px', fontWeight: tab === t.id ? 600 : 400,
              background: 'transparent', color: 'inherit', border: 'none',
              borderBottom: tab === t.id ? '2px solid currentColor' : '2px solid transparent',
              cursor: 'pointer', opacity: tab === t.id ? 1 : 0.5,
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 8px', fontSize: '11px',
            background: 'transparent', color: 'inherit', border: 'none',
            cursor: 'pointer', opacity: 0.4,
          }}
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'wallet' && <WalletTab />}
        {tab === 'approvals' && <ApprovalsTab />}
        {tab === 'devices' && <DevicesTab />}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px', textAlign: 'center', fontSize: '10px', opacity: 0.3,
        borderTop: '1px solid rgba(128,128,128,0.1)',
      }}>
        Lux Wallet v{chrome.runtime.getManifest().version}
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
