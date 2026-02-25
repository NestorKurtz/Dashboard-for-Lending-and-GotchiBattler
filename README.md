# Aavegotchi Lending Dashboard

A personal dashboard for managing Aavegotchi NFT lending on Base mainnet.

Built to manage a collection of ~68 Aavegotchis from a Trezor cold wallet, with a Rabby hot wallet set as the on-chain lending operator. The operator can list, cancel, and batch-manage all lending activity without ever needing the Trezor again.

## What it does

- **Dashboard** — grid view of all Gotchis with live status (available / listed / lent out)
- **Gotchi detail** — per-Gotchi lending history, current listing, quick-lend form
- **Address book** — named borrower addresses with tags (own wallets / friends / family)
- **Templates** — saved lending configs (period, revenue split, whitelist) for one-click relisting
- **Whitelists** — manage on-chain Aavegotchi whitelists
- **Batch calldata** — generate multicall3 calldata for agreeing multiple lendings at once from Basescan

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Chain reads | Alchemy RPC + multicall3 |
| Wallet / signing | wagmi v2 + viem (Rabby) |
| Styling | Tailwind CSS |
| Local DB | SQLite (better-sqlite3) |
| Network | Base mainnet (chain ID 8453) |

## Setup

```bash
cp .env.local.example .env.local
# fill in your values
npm install
npm run dev
```

Required env vars (see `.env.local.example`):

```
ALCHEMY_API_KEY=            # Alchemy API key for Base mainnet RPC
NEXT_PUBLIC_OWNER_ADDRESS=  # Trezor / cold wallet address (NFT owner)
NEXT_PUBLIC_OPERATOR_ADDRESS= # Rabby / hot wallet address (lending operator)
```

## Architecture

```
Rabby Wallet (browser)
      │ wagmi v2
      ▼
Next.js 14 App
├── API routes — chain reads via Alchemy + multicall3
├── API routes — local SQLite (address book, templates)
└── React UI (Tailwind)
      │
      ▼
Aavegotchi Diamond on Base
0xA99c4B08201F2913Db8D28e71d020c4298F29dBF
```

## Security model

- Owner (Trezor) never signs routine transactions — operator is set once
- `ALCHEMY_API_KEY` and wallet addresses live in `.env.local`, never committed
- SQLite DB (`data/`) is local only, never committed
