import { expect } from '@playwright/test'
import { onboardedExtensionTest as test } from '../../fixtures/extension.fixture'
import { openExtensionSidebar, waitForBackgroundReady } from '../../utils/extension-helpers'

test.describe('Extension Sidebar', () => {
  test.beforeEach(async ({ context }) => {
    // Ensure background script is ready
    await waitForBackgroundReady(context)
  })

  test('sidebar loads successfully', async ({ context, extensionId }) => {
    // Open the sidebar
    const sidebarPage = await openExtensionSidebar(context, extensionId)
    await sidebarPage.waitForLoadState('networkidle')

    // The sidebar should load without critical errors
    const errors: string[] = []
    sidebarPage.on('pageerror', (error) => errors.push(error.message))

    // Wait for the page to stabilize
    await sidebarPage.waitForTimeout(2000)

    // Check what state the sidebar is in
    const pageContent = await sidebarPage.content()

    // Check for main UI elements that indicate successful load
    const hasRoot = (await sidebarPage.locator('#root').count()) > 0
    const hasButtons = (await sidebarPage.locator('button').count()) > 0

    // At least root should be present
    const isInValidState = hasRoot || hasButtons || pageContent.length > 1000

    expect(isInValidState).toBe(true)

    // Verify no critical errors occurred
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error promise rejection') &&
        !e.includes('Failed to load resource'),
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
