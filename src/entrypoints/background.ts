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
})
