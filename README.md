# TARA Atelier POS

A local-first iPad POS web app for a perfume brand called TARA.

## Stack

- Next.js with TypeScript
- Tailwind CSS
- Prisma
- SQLite
- PWA support

## Core screens

- Dashboard with daily sales, top products, recent orders, and low-stock alerts
- POS selling floor with product catalog, cart, checkout, and customer capture
- Customer list with lifetime spend and repeat-buyer visibility
- Order history with item-level breakdown
- Local AI assistant page for sales summaries and restock prompts

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. If `pnpm` asks for build approvals, allow them once:

```bash
pnpm approve-builds --all
```

3. Create the local SQLite schema:

```bash
pnpm db:push
```

4. Seed the database with 8 perfume products and sample boutique data:

```bash
pnpm db:seed
```

5. Start the LAN-ready dev server:

```bash
pnpm dev
```

6. Open it on the Mac mini at `http://localhost:3000`.

7. Open it on the iPad over LAN at:

```bash
http://<mac-mini-local-ip>:3000
```

## PWA notes

- The app ships with a web manifest and service worker.
- For the most reliable installable PWA behavior, run a production build:

```bash
pnpm build
pnpm start
```

- You can also try local HTTPS during development:

```bash
pnpm dev:https
```

## Useful scripts

```bash
pnpm dev
pnpm dev:https
pnpm build
pnpm start
pnpm lint
pnpm db:push
pnpm db:seed
pnpm db:studio
```

## Reset the local database

```bash
rm -f prisma/dev.db prisma/dev.db-journal
pnpm db:push
pnpm db:seed
```
