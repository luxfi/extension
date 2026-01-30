import React from 'react'
import { createRoot } from 'react-dom/client'

function OnboardingApp() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '48px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#ffffff',
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        marginBottom: '32px',
        background: '#000',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
          <polygon points="24,8 40,40 8,40" fill="white" />
        </svg>
      </div>
      <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '12px' }}>
        Welcome to Lux Wallet
      </h1>
      <p style={{
        fontSize: '18px',
        opacity: 0.8,
        marginBottom: '48px',
        maxWidth: '500px',
        lineHeight: 1.5,
      }}>
        Your secure gateway to the Lux ecosystem. Create or import a wallet to get started.
      </p>
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button style={{
          padding: '16px 32px',
          fontSize: '18px',
          fontWeight: 600,
          background: '#fff',
          color: '#000',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          minWidth: '200px',
        }}>
          Create New Wallet
        </button>
        <button style={{
          padding: '16px 32px',
          fontSize: '18px',
          fontWeight: 600,
          background: 'transparent',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '12px',
          cursor: 'pointer',
          minWidth: '200px',
        }}>
          Import Existing Wallet
        </button>
      </div>
      <div style={{
        marginTop: '64px',
        display: 'flex',
        gap: '32px',
        opacity: 0.6,
        fontSize: '14px',
      }}>
        <span>✓ Multi-chain support</span>
        <span>✓ Self-custody</span>
        <span>✓ Open source</span>
      </div>
    </div>
  )
}

const container = document.getElementById('onboarding-root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <OnboardingApp />
    </React.StrictMode>
  )
}
