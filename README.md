# Aavegotchi Lending Dashboard

A self-hosted web dashboard for managing Aavegotchi NFT lending on **Base mainnet**.

Built around a cold/hot wallet split: a Trezor hardware wallet owns the NFTs, while a Rabby hot wallet is set as the on-chain lending operator. The operator can list, cancel, and batch-manage all lending activity — the Trezor never needs to sign again.

![Dashboard screenshot](https://github.com/user-attachments/assets/a2c1333d-4f6a-411b-a72c-0a5e2ec5f172)

---

## Features

- **Gotchi grid** — live overview of all gotchis with status badges (available / listed / lent out), sorted by base rarity score
- **Gotchi detail** — current lending info, traits, and a quick-lend form per gotchi
- **Lending modal** — list or cancel gotchi lending directly from the UI (signs via connected wallet)
- **Address book** — save and tag borrower addresses (own wallets / friends / family)
- **Templates** — reusable lending configurations (period, revenue split, whitelist) for one-click relisting
- **Whitelist management** — create on-chain Aavegotchi whitelists and manage members
- **Batch calldata generator** — produce multicall3 calldata to agree multiple lendings at once, for use in Basescan's Write Contract UI
- **Settings** — configure operator address and default lending parameters

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Chain reads | Alchemy RPC + multicall3 |
| Wallet / signing | wagmi v2 + viem (Rabby) |
| Styling | Tailwind CSS |
| Local database | SQLite via better-sqlite3 |
| Network | Base mainnet (chain ID 8453) |
| Contract | Aavegotchi Diamond `0xA99c4B08201F2913Db8D28e71d020c4298F29dBF` |

---

## Prerequisites

- Node.js 18+
- An [Alchemy](https://alchemy.com) account with a Base mainnet app
- A wallet set as **lending operator** on the Aavegotchi Diamond contract

---

## Setup

```bash
git clone https://github.com/NestorKurtz/Dashboard-for-Lending-and-GotchiBattler.git
cd Dashboard-for-Lending-and-GotchiBattler
npm install
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
ALCHEMY_API_KEY=           # Alchemy API key for Base mainnet RPC
NEXT_PUBLIC_OWNER_ADDRESS= # Cold wallet address that owns the Aavegotchis
NEXT_PUBLIC_OPERATOR_ADDRESS= # Hot wallet address set as lending operator
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Security Model

| What | Where | Committed? |
|---|---|---|
| Alchemy API key | `.env.local` | No — gitignored |
| Wallet addresses | `.env.local` | No — gitignored |
| SQLite database | `data/` | No — gitignored |
| Operator key / private keys | Never used server-side | — |

The app is read-only on the server side (RPC calls only). All write transactions are signed client-side by the connected wallet. No private keys are ever stored or transmitted.

---

## Utility Scripts

Two Node scripts in `scripts/` for use outside the UI:

```bash
# Check current whitelist/lending state for specific token IDs
ALCHEMY_API_KEY=your_key node scripts/check-whitelist.mjs

# Generate batch agreeGotchiLending calldata (requires dev server running)
node scripts/gen-agree-calldata.mjs [count]
# count defaults to 17 — top N gotchis by BRS
```

---

## Project Structure

```
app/
  page.tsx                  # Dashboard (gotchi grid)
  gotchi/[id]/page.tsx      # Gotchi detail
  address-book/page.tsx     # Named borrower addresses
  templates/page.tsx        # Lending templates
  whitelists/page.tsx       # Whitelist management
  settings/page.tsx         # App settings
  api/                      # Next.js API routes (chain reads + SQLite)
components/
  GotchiCard.tsx            # Grid card with status badge
  LendingModal.tsx          # List / cancel lending form
  CodeExportModal.tsx       # Batch calldata export
lib/
  lending.ts                # Core lending logic and gotchi enrichment
  db.ts                     # SQLite schema and queries
  multicall.ts              # multicall3 encode / decode helpers
  aavegotchi-abi.ts         # Aavegotchi Diamond ABI (relevant functions)
scripts/
  gen-agree-calldata.mjs    # Batch calldata generator
  check-whitelist.mjs       # On-chain state checker
```

---

## Tests

```bash
npm test
```

44 tests across API routes, lending logic, multicall encoding, and database operations.
