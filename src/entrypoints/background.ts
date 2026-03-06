export default defineBackground(() => {
  console.log('Lux Wallet background service worker started')

  // Detect browser capabilities
  const hasSidePanel = typeof chrome !== 'undefined' && 'sidePanel' in chrome
  const hasAction = typeof chrome !== 'undefined' && 'action' in chrome
  const hasBrowserAction = typeof browser !== 'undefined' && 'browserAction' in browser

  // Handle extension icon click
  if (hasAction && chrome.action?.onClicked) {
    chrome.action.onClicked.addListener(async (tab) => {
      if (hasSidePanel && tab.id) {
        // Chrome/Chromium: Open side panel
        await chrome.sidePanel.open({ tabId: tab.id })
      } else {
        // Firefox/Safari: Open popup in new tab or window
        chrome.tabs.create({ url: chrome.runtime.getURL('/sidepanel.html') })
      }
    })
  } else if (hasBrowserAction && browser.browserAction?.onClicked) {
    // Firefox MV2 fallback
    browser.browserAction.onClicked.addListener(async () => {
      browser.tabs.create({ url: browser.runtime.getURL('/sidepanel.html') })
    })
  }

  // Handle installation
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('Lux Wallet installed')
      // Open onboarding page on first install
      chrome.tabs.create({ url: chrome.runtime.getURL('/onboarding.html') })
    } else if (details.reason === 'update') {
      console.log('Lux Wallet updated to version', chrome.runtime.getManifest().version)
    }
  })

  // Configure side panel (Chrome/Chromium only)
  if (hasSidePanel) {
    chrome.sidePanel.setOptions({
      enabled: true,
    })

    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    })
  }

  // MPC pending approval polling
  const MPC_API = 'https://mpc.lux.network/api/v1'

  async function checkPendingApprovals() {
    try {
      const token = await chrome.storage.local.get('mpc_token')
      if (!token.mpc_token) return

      const res = await fetch(`${MPC_API}/transactions`, {
        headers: { Authorization: `Bearer ${token.mpc_token}` },
      })
      if (!res.ok) return

      const txs = await res.json()
      const pending = txs.filter((t: any) => t.status === 'pending_approval')

      if (pending.length > 0) {
        // Update badge
        if (hasAction) {
          chrome.action.setBadgeText({ text: String(pending.length) })
          chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' })
        }

        // Show notification for new pending tx
        const lastCount = (await chrome.storage.local.get('last_pending_count')).last_pending_count || 0
        if (pending.length > lastCount) {
          chrome.notifications.create('mpc-pending', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
            title: 'MPC Approval Required',
            message: `${pending.length} transaction(s) waiting for your approval`,
          })
        }
        await chrome.storage.local.set({ last_pending_count: pending.length })
      } else {
        if (hasAction) {
          chrome.action.setBadgeText({ text: '' })
        }
        await chrome.storage.local.set({ last_pending_count: 0 })
      }
    } catch {
      // Silently fail — user may not be logged in
    }
  }

  // Poll every 30 seconds
  chrome.alarms.create('mpc-poll', { periodInMinutes: 0.5 })
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'mpc-poll') {
      checkPendingApprovals()
    }
  })

  // Also check immediately on startup
  checkPendingApprovals()

  // Sync token from localStorage to chrome.storage for background access
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'mpc_token_set') {
      chrome.storage.local.set({ mpc_token: message.token })
      checkPendingApprovals()
      sendResponse({ ok: true })
    } else if (message.type === 'mpc_token_clear') {
      chrome.storage.local.remove('mpc_token')
      if (hasAction) chrome.action.setBadgeText({ text: '' })
      sendResponse({ ok: true })
    }
    return true
  })
})
