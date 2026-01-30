# Lux Wallet Browser Extension

A self-custody crypto wallet for the Lux ecosystem with multi-chain support.

## Features

- **Multi-Chain Support**: Connect to Lux, Zoo, SPC, Hanzo networks and major EVM chains
- **Hardware Wallet Integration**: Ledger, Trezor, Keystone support
- **Security Engine**: Transaction risk analysis and protection
- **Address Book**: Manage contacts and frequently used addresses
- **Custom Networks**: Add any EVM-compatible network

## Supported Networks

### Lux Ecosystem
| Network | Chain ID | Type |
|---------|----------|------|
| Lux Mainnet | 96369 | Mainnet |
| Lux Testnet | 96368 | Testnet |
| Zoo Mainnet | 200200 | Mainnet |
| Zoo Testnet | 200201 | Testnet |
| SPC Mainnet | 36911 | Mainnet |
| SPC Testnet | 36912 | Testnet |
| Hanzo Mainnet | 36963 | Mainnet |
| Hanzo Testnet | 36962 | Testnet |

### External Chains
- Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BNB Chain, Blast, Zora

## Development

```bash
# Install dependencies
pnpm install

# Start development server (Chrome)
pnpm dev

# Start development server (Firefox)
pnpm dev:firefox

# Build for production
pnpm build          # Chrome
pnpm build:firefox  # Firefox

# Create distribution zips
pnpm zip            # Chrome
pnpm zip:firefox    # Firefox
```

## Installation

### From Release
1. Download the latest release from [GitHub Releases](https://github.com/luxfi/extension/releases)
2. Unzip the downloaded file
3. **Chrome**: Go to `chrome://extensions`, enable Developer Mode, click "Load unpacked" and select the unzipped folder
4. **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and select the manifest.json

### From Source
1. Clone the repository
2. Run `pnpm install`
3. Run `pnpm build` or `pnpm build:firefox`
4. Load the extension from `.output/chrome-mv3` or `.output/firefox-mv2`

## Architecture

Built with:
- [WXT](https://wxt.dev/) - Modern web extension framework
- React 19
- Redux Toolkit + Redux Saga
- Tamagui UI components
- ethers.js

## Security

- All private keys are encrypted and stored locally
- Transaction simulation before signing
- Phishing and scam protection
- Open source and auditable

## License

MIT
