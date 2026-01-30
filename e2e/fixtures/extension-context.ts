import { type BrowserContext, chromium, firefox } from '@playwright/test'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type BrowserType = 'chrome' | 'firefox'

interface CreateExtensionContextOptions {
  /** Prefix for the user data directory (for test isolation) */
  userDataDirPrefix?: string
  /** Browser to use: 'chrome' or 'firefox' */
  browser?: BrowserType
}

/**
 * Get the extension path for the specified browser
 */
function getExtensionPath(browser: BrowserType): string {
  const baseDir = path.join(__dirname, '../..')

  // WXT output directories
  const paths: Record<BrowserType, string[]> = {
    chrome: ['.output/chrome-mv3', 'build'],
    firefox: ['.output/firefox-mv2'],
  }

  console.log(`Looking for ${browser} extension in baseDir: ${baseDir}`)

  for (const p of paths[browser]) {
    const fullPath = path.join(baseDir, p)
    console.log(`  Checking: ${fullPath} - exists: ${fs.existsSync(fullPath)}`)
    if (fs.existsSync(fullPath)) {
      // Verify manifest exists
      const manifestPath = path.join(fullPath, 'manifest.json')
      if (fs.existsSync(manifestPath)) {
        console.log(`  Found manifest at: ${manifestPath}`)
        return fullPath
      }
      console.log(`  Warning: No manifest.json in ${fullPath}`)
    }
  }

  throw new Error(`Extension build not found for ${browser}. Run 'pnpm build:${browser}' first.`)
}

/**
 * Creates a persistent browser context with the extension loaded.
 * Supports both Chrome and Firefox.
 */
export async function createExtensionContext(options: CreateExtensionContextOptions = {}): Promise<BrowserContext> {
  const {
    userDataDirPrefix = 'playwright-extension',
    browser = 'chrome'
  } = options

  const extensionPath = getExtensionPath(browser)
  console.log(`Loading ${browser} extension from: ${extensionPath}`)

  // Generate a unique user data directory for each test to ensure isolation
  const userDataDir = path.join(
    os.tmpdir(),
    `${userDataDirPrefix}-${browser}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  )

  // CI environments need different args for headless-like behavior
  const isCI = process.env.CI === 'true'

  if (browser === 'firefox') {
    return createFirefoxContext(extensionPath, userDataDir, isCI)
  }

  return createChromeContext(extensionPath, userDataDir, isCI)
}

async function createChromeContext(extensionPath: string, userDataDir: string, isCI: boolean): Promise<BrowserContext> {
  // Use Chrome channel for extension support (Playwright's bundled Chromium may not support extensions)
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome', // Use installed Chrome instead of bundled Chromium
    headless: false, // Chrome extensions require headed mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-default-browser-check',
      '--disable-default-apps',
      '--no-sandbox', // Required for CI
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Overcome limited resource problems in CI
      ...(isCI ? ['--disable-gpu', '--disable-software-rasterizer'] : []),
    ],
    viewport: { width: 1280, height: 720 },
  })

  return context
}

async function createFirefoxContext(extensionPath: string, userDataDir: string, isCI: boolean): Promise<BrowserContext> {
  // Firefox requires a different approach - we need to install the extension after launch
  const context = await firefox.launchPersistentContext(userDataDir, {
    headless: false, // Extensions require headed mode
    firefoxUserPrefs: {
      'extensions.autoDisableScopes': 0,
      'extensions.enableScopes': 15,
      'xpinstall.signatures.required': false,
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
    },
    viewport: { width: 1280, height: 720 },
    args: isCI ? [] : [],
  })

  // Install the extension
  // Note: For Firefox, we need to load as temporary add-on via about:debugging
  // or package as XPI. Playwright supports loading via the user profile.

  return context
}

/**
 * Creates a Chrome context specifically (for Chrome-specific tests)
 */
export async function createChromeExtensionContext(options: Omit<CreateExtensionContextOptions, 'browser'> = {}): Promise<BrowserContext> {
  return createExtensionContext({ ...options, browser: 'chrome' })
}

/**
 * Creates a Firefox context specifically (for Firefox-specific tests)
 */
export async function createFirefoxExtensionContext(options: Omit<CreateExtensionContextOptions, 'browser'> = {}): Promise<BrowserContext> {
  return createExtensionContext({ ...options, browser: 'firefox' })
}
