import { expect } from '@playwright/test'
import { freshExtensionTest as test } from '../../fixtures/extension.fixture'
import { ONE_SECOND_MS, sleep } from '../../utils/timing'

test.describe('Basic Extension Setup', () => {
  test('extension loads successfully', async ({ context, extensionId }) => {
    // Verify extension ID was captured
    expect(extensionId).toBeTruthy()
    expect(extensionId).toMatch(/^[a-z]{32}$/)

    // Wait for extension pages to appear with retry logic
    let extensionPages: unknown[] = []
    const maxAttempts = 20
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(ONE_SECOND_MS)
      const pages = context.pages()
      extensionPages = pages.filter((page) => page.url().includes(`chrome-extension://${extensionId}`))
      if (extensionPages.length > 0) {
        break
      }
    }

    // Check that we have at least one page open
    const pages = context.pages()
    expect(pages.length).toBeGreaterThan(0)

    // Verify at least one page is from the extension
    expect(extensionPages.length).toBeGreaterThan(0)
  })

  test('background script loads', async ({ context }) => {
    // Wait for background script/service worker to load
    await sleep(ONE_SECOND_MS * 2)

    // Check for background pages or service workers
    const backgroundPages = context.backgroundPages()
    const serviceWorkers = context.serviceWorkers()

    // Either background pages or service workers should exist
    const hasBackground = backgroundPages.length > 0 || serviceWorkers.length > 0
    expect(hasBackground).toBeTruthy()
  })

  test('manifest is valid', async ({ context, extensionId }) => {
    // Navigate to the extension's manifest
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/manifest.json`)

    // Get the manifest content
    const content = await page.textContent('body')
    expect(content).toBeTruthy()

    // Parse and validate manifest
    const manifest = JSON.parse(content || '{}')
    expect(manifest.name).toBe('Lux Wallet')
    expect(manifest.manifest_version).toBe(3)
    expect(manifest.version).toBeTruthy()
  })

  test('onboarding page opens on install', async ({ context, extensionId }) => {
    // Wait for onboarding page to open
    await sleep(ONE_SECOND_MS * 3)

    const pages = context.pages()
    const onboardingPage = pages.find(
      (page) => page.url().includes(`chrome-extension://${extensionId}`) && page.url().includes('onboarding')
    )

    expect(onboardingPage).toBeTruthy()
  })
})
