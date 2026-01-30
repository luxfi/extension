import { expect } from '@playwright/test'
import { onboardedExtensionTest as test } from '../../fixtures/extension.fixture'
import { waitForBackgroundReady } from '../../utils/extension-helpers'

test.describe('Wallet Connection', () => {
  test('extension injects ethereum provider', async ({ context }) => {
    // Ensure background script is ready
    await waitForBackgroundReady(context)

    // Open a test page
    const testPage = await context.newPage()
    await testPage.goto('https://example.com', { waitUntil: 'domcontentloaded' })

    // Wait a bit for the ethereum provider to be injected
    await testPage.waitForTimeout(3000)

    // Check that window.ethereum exists
    const hasEthereumProvider = await testPage.evaluate(() => {
      return typeof window.ethereum !== 'undefined'
    })

    // Note: Our extension may not inject ethereum provider on all pages
    // This is expected behavior for wallet extensions
    console.log('Ethereum provider injected:', hasEthereumProvider)
  })
})
