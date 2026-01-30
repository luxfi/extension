import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        marginBottom: '24px',
        background: '#000',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <polygon points="24,8 40,40 8,40" fill="white" />
        </svg>
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        Lux Wallet
      </h1>
      <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '32px' }}>
        Multi-chain crypto wallet for the Lux ecosystem
      </p>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '280px',
      }}>
        <button style={{
          padding: '14px 24px',
          fontSize: '16px',
          fontWeight: 500,
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
        }}>
          Create Wallet
        </button>
        <button style={{
          padding: '14px 24px',
          fontSize: '16px',
          fontWeight: 500,
          background: 'transparent',
          color: 'inherit',
          border: '1px solid currentColor',
          borderRadius: '12px',
          cursor: 'pointer',
          opacity: 0.8,
        }}>
          Import Wallet
        </button>
      </div>
      <p style={{
        marginTop: '32px',
        fontSize: '12px',
        opacity: 0.5,
      }}>
        Version {chrome.runtime.getManifest().version}
      </p>
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
