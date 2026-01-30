import { defineConfig } from 'wxt'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'

const icons = {
  16: 'assets/icons/icon16.png',
  32: 'assets/icons/icon32.png',
  48: 'assets/icons/icon48.png',
  128: 'assets/icons/icon128.png',
}

const BASE_NAME = 'Lux Wallet'
const BASE_DESCRIPTION = 'Lux Wallet - A self-custody crypto wallet for the Lux ecosystem with multi-chain support.'
const BASE_VERSION = '1.0.0'

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  publicDir: 'src/public',
  imports: false,
  modules: ['@wxt-dev/module-react'],

  manifest: (env) => {
    const isDevelopment = env.mode === 'development'

    return {
      name: BASE_NAME,
      description: BASE_DESCRIPTION,
      version: BASE_VERSION,
      minimum_chrome_version: '116',
      icons,
      action: {
        default_icon: icons,
      },
      side_panel: {
        default_path: 'sidepanel.html',
      },
      content_scripts: [
        {
          id: 'injected',
          run_at: 'document_start',
          matches: isDevelopment
            ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
            : ['https://*/*'],
          js: ['content-scripts/injected.js'],
        },
        {
          id: 'ethereum',
          run_at: 'document_start',
          matches: isDevelopment
            ? ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*']
            : ['https://*/*'],
          js: ['content-scripts/ethereum.js'],
          world: 'MAIN',
        },
      ],
      permissions: ['alarms', 'notifications', 'sidePanel', 'storage', 'tabs'],
      host_permissions: ['https://*.lux.exchange/*', 'https://*.lux.network/*'],
      commands: {
        _execute_action: {
          suggested_key: {
            default: 'Ctrl+Shift+L',
            mac: 'Command+Shift+L',
          },
          description: 'Open Lux Wallet',
        },
      },
      externally_connectable: {
        ids: [],
        matches: isDevelopment
          ? ['https://app.lux.exchange/*', 'https://*.lux.exchange/*', 'https://*.lux.network/*', 'http://localhost/*', 'http://127.0.0.1/*']
          : ['https://app.lux.exchange/*', 'https://*.lux.exchange/*', 'https://*.lux.network/*'],
      },
    }
  },

  vite: () => {
    const isProduction = process.env.NODE_ENV === 'production'

    return {
      define: {
        __DEV__: !isProduction,
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.IS_LUX_WALLET': '"true"',
      },
      resolve: {
        extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
        alias: {
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
          },
          include: '**/*.svg',
        }),
        nodePolyfills({
          globals: {
            process: true,
          },
        }),
      ],
      build: {
        sourcemap: !isProduction,
        minify: isProduction ? 'esbuild' : undefined,
      },
    }
  },

  webExt: {
    startUrls: ['https://app.lux.exchange'],
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    keepProfileChanges: true,
    firefoxProfile: './.wxt/firefox-data',
  },
})
