import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'wxt'

const icons = {
  16: 'assets/icons/icon16.png',
  32: 'assets/icons/icon32.png',
  48: 'assets/icons/icon48.png',
  128: 'assets/icons/icon128.png',
}

const BASE_NAME = 'Lux Wallet'
const BASE_DESCRIPTION = 'Lux Wallet - A self-custody crypto wallet for the Lux ecosystem with multi-chain support.'
const BASE_VERSION = '1.0.0'

const BUILD_NUM = parseInt(process.env.BUILD_NUM || '0')
const EXTENSION_VERSION = `${BASE_VERSION}.${BUILD_NUM}`

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  publicDir: 'src/public',
  outDir: process.env.WXT_ABSOLUTE_OUTDIR || undefined,
  outDirTemplate: process.env.WXT_ABSOLUTE_OUTDIR ? '' : undefined,
  imports: false,
  modules: ['@wxt-dev/module-react'],

  manifest: (env) => {
    const isDevelopment = env.mode === 'development'
    const BUILD_ENV = isDevelopment ? undefined : process.env.BUILD_ENV
    const isFirefox = env.browser === 'firefox'

    const EXTENSION_NAME_POSTFIX = BUILD_ENV === 'dev' ? 'DEV' : BUILD_ENV === 'beta' ? 'BETA' : ''
    const name = EXTENSION_NAME_POSTFIX ? `${BASE_NAME} ${EXTENSION_NAME_POSTFIX}` : BASE_NAME

    let description = BASE_DESCRIPTION
    if (BUILD_ENV === 'beta') {
      description = 'THIS EXTENSION IS FOR BETA TESTING'
    }
    if (BUILD_ENV === 'dev') {
      description = 'THIS EXTENSION IS FOR DEV TESTING'
    }

    // Base permissions (cross-browser compatible)
    const permissions: string[] = ['alarms', 'notifications', 'storage', 'tabs']

    // Add Chrome-only permissions
    if (!isFirefox) {
      permissions.push('sidePanel')
    }

    const manifest: Record<string, unknown> = {
      name,
      description,
      version: EXTENSION_VERSION,
      icons,
      permissions,
      commands: {
        _execute_action: {
          suggested_key: {
            default: 'Ctrl+Shift+L',
            mac: 'Command+Shift+L',
          },
          description: 'Toggle Lux Wallet',
        },
      },
    }

    // Chrome-specific settings
    if (!isFirefox) {
      manifest.minimum_chrome_version = '116'
      manifest.action = {
        default_icon: icons,
      }
      manifest.externally_connectable = {
        ids: [],
        matches: BUILD_ENV === 'prod'
          ? ['https://app.lux.exchange/*', 'https://*.lux.exchange/*', 'https://*.lux.network/*']
          : ['https://app.lux.exchange/*', 'https://*.lux.exchange/*', 'https://*.lux.network/*', 'http://localhost/*', 'http://127.0.0.1/*'],
      }
    }

    // Firefox-specific settings
    if (isFirefox) {
      manifest.browser_specific_settings = {
        gecko: {
          id: '{lux-wallet@lux.network}',
          strict_min_version: '109.0',
        },
      }
      manifest.browser_action = {
        default_icon: icons,
        default_title: BASE_NAME,
      }
    }

    return manifest
  },

  vite: (env) => {
    const __dirname = path.dirname(new URL(import.meta.url).pathname)
    const isProduction = env.mode === 'production'

    return {
      define: {
        __DEV__: !isProduction,
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(env.mode || 'development'),
        'process.env.VERSION': JSON.stringify(EXTENSION_VERSION),
        'process.env.IS_LUX_EXTENSION': '"true"',
      },

      resolve: {
        extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
        alias: {
          '@': path.resolve(__dirname, 'src'),
          'react-native': 'react-native-web',
        },
      },

      plugins: [
        svgr({
          svgrOptions: {
            icon: false,
            ref: true,
            titleProp: true,
            exportType: 'named',
            svgo: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: { removeViewBox: false },
                  },
                },
                'removeDimensions',
              ],
            },
          },
          include: '**/*.svg',
        }),
        nodePolyfills({
          globals: {
            process: true,
          },
        }),
      ].filter(Boolean),

      optimizeDeps: {
        include: [
          'buffer',
          'react-native-web',
          'ethers',
          'eventemitter3',
        ],
      },

      build: {
        sourcemap: isProduction ? false : 'hidden',
        minify: isProduction ? 'esbuild' : undefined,
        rollupOptions: {
          output: {
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
        chunkSizeWarningLimit: 800,
      },
    }
  },

  dev: {
    server: {
      port: 9998,
    },
  },

  webExt: {
    startUrls: ['https://app.lux.exchange'],
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    keepProfileChanges: true,
    firefoxProfile: './.wxt/firefox-data',
  },
})
