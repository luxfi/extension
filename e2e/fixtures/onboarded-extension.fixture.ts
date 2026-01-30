import { type BrowserContext, test as base } from '@playwright/test'
import { createExtensionContext } from './extension-context'
import { completeOnboarding } from '../utils/onboarding-helpers'
import { waitForExtensionLoad } from '../utils/wait-for-extension'
import { TEN_SECONDS_MS } from '../utils/timing'

interface OnboardedExtensionFixtures {
  context: BrowserContext
  extensionId: string
}

// Extension test fixture that programmatically completes onboarding
export const onboardedExtensionTest = base.extend<OnboardedExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: fixture file
  context: async ({}, use) => {
    const context = await createExtensionContext({
      userDataDirPrefix: 'playwright-extension-onboarded',
    })

    try {
      // Wait for extension to load and onboarding to appear
      const { onboardingPage } = await waitForExtensionLoad(context, {
        timeout: TEN_SECONDS_MS,
        waitForOnboarding: true,
      })

      // Complete onboarding programmatically
      if (onboardingPage) {
        await completeOnboarding(context, onboardingPage)
      } else {
        // Try to complete onboarding anyway - it might open later
        await completeOnboarding(context)
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      await context.close()
      throw error
    }

    await use(context)
    await context.close()
  },

  extensionId: async ({ context }, use) => {
    const { extensionId } = await waitForExtensionLoad(context, { timeout: TEN_SECONDS_MS })
    await use(extensionId)
  },
})
