import { defineBackground } from 'wxt/sandbox'

export default defineBackground({
  type: 'module',
  main() {
    console.log('Lux Wallet background service worker started')

    // Handle extension icon click
    chrome.action.onClicked.addListener(async (tab) => {
      // Open side panel when action is clicked
      if (tab.id) {
        await chrome.sidePanel.open({ tabId: tab.id })
      }
    })

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

    // Configure side panel
    chrome.sidePanel.setOptions({
      enabled: true,
    })

    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    })
  },
})
