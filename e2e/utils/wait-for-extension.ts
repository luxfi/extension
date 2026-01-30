import type { BrowserContext } from '@playwright/test'
import { sleep } from './timing'

export async function waitForExtensionLoad(
  context: BrowserContext,
  options?: {
    timeout?: number
    waitForOnboarding?: boolean
  },
): Promise<{ extensionId: string; onboardingPage?: unknown }> {
  const timeout = options?.timeout ?? 30000
  const startTime = Date.now()

  let extensionId: string | undefined
  let onboardingPage: unknown

  let iteration = 0
  while (Date.now() - startTime < timeout) {
    iteration++
    // Check all pages
    const pages = context.pages()
    if (iteration === 1 || iteration % 50 === 0) {
      console.log(`[waitForExtensionLoad] Iteration ${iteration}: Found ${pages.length} pages, ${context.backgroundPages().length} bg pages, ${context.serviceWorkers().length} service workers`)
      for (const page of pages) {
        console.log(`  Page URL: ${page.url()}`)
      }
    }
    for (const page of pages) {
      const url = page.url()
      if (url.startsWith('chrome-extension://')) {
        extensionId = url.split('/')[2]
        if (url.includes('onboarding')) {
          onboardingPage = page
        }
        break
      }
    }

    // Check background pages
    if (!extensionId) {
      const backgroundPages = context.backgroundPages()
      for (const page of backgroundPages) {
        const url = page.url()
        if (url.startsWith('chrome-extension://')) {
          extensionId = url.split('/')[2]
          break
        }
      }
    }

    // Check service workers
    if (!extensionId) {
      const workers = context.serviceWorkers()
      for (const worker of workers) {
        const url = worker.url()
        if (iteration === 1 || iteration % 50 === 0) {
          console.log(`  Service worker URL: ${url}`)
        }
        if (url.startsWith('chrome-extension://')) {
          extensionId = url.split('/')[2]
          break
        }
      }
    }

    // If we found the extension and we're waiting for onboarding, keep checking
    if (extensionId && options?.waitForOnboarding && !onboardingPage) {
      // Continue waiting for onboarding page
    } else if (extensionId) {
      // We have what we need
      break
    }

    await sleep(100)
  }

  if (!extensionId) {
    throw new Error(`Extension failed to load within ${timeout}ms`)
  }

  return { extensionId, onboardingPage }
}
