# TARA Atelier POS

A premium iPad POS web app for the TARA perfume brand, now prepared for secure online access instead of LAN-only use.

## Stack

- Next.js with TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL for hosted deployments
- PWA support

## Core screens

- Dashboard with daily sales, top products, recent orders, and low-stock alerts
- POS selling floor with product catalog, cart, checkout, and customer capture
- Customer list with lifetime spend and repeat-buyer visibility
- Order history with item-level breakdown
- Local AI assistant page for sales summaries and restock prompts

## Online deployment profile

This app has been shifted from a LAN-only SQLite setup to an internet-ready deployment profile.

- Data now expects a hosted PostgreSQL database.
- The app includes a built-in staff login gate for public deployment.
- Docker support is included so you can deploy it on any Node or container host.

## Environment variables

Create a `.env` file from `.env.example` and set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/tara_pos?schema=public&sslmode=require"
NEXT_PUBLIC_APP_URL="https://pos.yourdomain.com"
POS_ADMIN_PASSWORD="a-strong-staff-password"
POS_SESSION_SECRET="a-long-random-secret"
```

`NEXT_PUBLIC_APP_URL` should be the final public HTTPS URL of the POS.

## Development setup

The app now expects PostgreSQL locally as well. You can use a managed Postgres database or a local Postgres instance.

1. Install dependencies:

```bash
pnpm install
```

2. If `pnpm` asks for build approvals, allow them once:

```bash
pnpm approve-builds --all
```

3. Create the database tables:

```bash
pnpm db:push
```

4. Seed the database with 8 perfume products and sample boutique data:

```bash
pnpm db:seed
```

5. Start the app:

```bash
pnpm dev
```

6. Open it at `http://localhost:3000`.

## Production database workflow

For production, use Prisma migrations instead of `db push`:

```bash
pnpm db:deploy
```

This applies the committed migration in `prisma/migrations` to the hosted Postgres database.

## Docker deployment

The repo now includes a `Dockerfile` and `.dockerignore`.

1. Build the image:

```bash
docker build -t tara-pos .
```

2. Run it with your production environment variables:

```bash
docker run --rm -p 3000:3000 \
  --env-file .env \
  tara-pos
```

The container runs `pnpm db:deploy` before starting the web server, so the schema is applied automatically.

## Going live

To make the POS reachable online:

1. Provision a hosted PostgreSQL database.
2. Deploy this app on any Node.js or Docker host.
3. Point your domain, such as `pos.taraatelier.com`, to the deployment.
4. Use HTTPS in production.
5. Share the staff password only with the team operating the POS.

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
pnpm db:migrate
pnpm db:deploy
pnpm lint
pnpm db:push
pnpm db:seed
pnpm db:studio
```

## Reset the database and reseed

```bash
pnpm db:push
pnpm db:seed
```
