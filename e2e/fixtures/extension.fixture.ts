import { type BrowserContext, test as base } from '@playwright/test'
import { createExtensionContext, type BrowserType } from './extension-context'
import { waitForExtensionLoad } from '../utils/wait-for-extension'

interface ExtensionFixtures {
  context: BrowserContext
  extensionId: string
  browser: BrowserType
}

/**
 * Chrome extension test fixture
 */
export const chromeExtensionTest = base.extend<ExtensionFixtures>({
  browser: ['chrome', { option: true }],
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const context = await createExtensionContext({ browser: 'chrome' })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    const { extensionId } = await waitForExtensionLoad(context, { timeout: 30000 })
    await use(extensionId)
  },
})

/**
 * Firefox extension test fixture
 * Note: Firefox extension loading in Playwright is limited
 */
export const firefoxExtensionTest = base.extend<ExtensionFixtures>({
  browser: ['firefox', { option: true }],
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const context = await createExtensionContext({ browser: 'firefox' })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    // Firefox doesn't expose extension ID the same way
    // We'll need to use a different detection method
    await use('firefox-extension')
  },
})

// Default to Chrome for backward compatibility
export const freshExtensionTest = chromeExtensionTest

// Re-export the programmatic onboarded extension test fixture
export { onboardedExtensionTest } from './onboarded-extension.fixture'
