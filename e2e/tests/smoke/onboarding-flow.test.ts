import { expect } from '@playwright/test'
import { freshExtensionTest as test } from '../../fixtures/extension.fixture'
import { TEN_SECONDS_MS } from '../../utils/timing'

test.describe('Extension Onboarding Flow', () => {
  test('onboarding tab opens automatically on fresh install', async ({ context }) => {
    // Wait for onboarding tab to open automatically
    const onboardingPage = await context.waitForEvent('page', {
      predicate: (page) => page.url().includes('onboarding.html'),
      timeout: TEN_SECONDS_MS,
    })

    // Verify onboarding page loaded
    expect(onboardingPage).toBeTruthy()
    await onboardingPage.waitForLoadState('networkidle')

    // Check that the onboarding page is loaded
    // Look for onboarding-specific elements
    await onboardingPage.waitForSelector('button, input, [data-testid]', { timeout: 5000 })

    // Verify we're on the onboarding page
    const title = await onboardingPage.title()
    expect(title.toLowerCase()).toContain('lux')
  })

  test('background script initializes on fresh install', async ({ context }) => {
    // Wait for any extension page to load
    await context.waitForEvent('page', {
      predicate: (page) => page.url().includes('chrome-extension://'),
      timeout: 5000,
    })

    // Check for service workers or background pages
    const backgroundPages = context.backgroundPages()
    const serviceWorkers = context.serviceWorkers()

    // Either background pages or service workers should exist
    const hasBackground = backgroundPages.length > 0 || serviceWorkers.length > 0
    expect(hasBackground).toBe(true)
  })
})
