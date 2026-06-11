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
- Manager-only staff directory with role-aware access
- Local AI assistant page for sales summaries, restock prompts, and Tomedes SMART handoff packs
- Creative studio with uploaded reference photos, POS product-photo fallback, 10 emotional storytelling campaign prompt modes, fresh-request variation to avoid same-looking outputs, aspect presets, upscale-aware image generation prompts, Midjourney handoff packs, and Tomedes SMART prompt-refinement briefs

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
POS_SESSION_SECRET="a-long-random-secret"
OPENAI_API_KEY="sk-..."
OPENAI_IMAGE_MODEL="gpt-image-1.5"
SEED_MANAGER_PASSWORD="set-daniels-bootstrap-password"
SEED_SALES_MANAGER_PASSWORD="set-shireens-bootstrap-password"
SEED_CASHIER_PASSWORD="set-cashier-bootstrap-password"
SEED_SYAZ_PASSWORD="set-syaz-bootstrap-password"
SEED_JERMAINE_PASSWORD="set-jermaines-bootstrap-password"
```

`NEXT_PUBLIC_APP_URL` should be the final public HTTPS URL of the POS.
The seeded staff usernames are `daniel`, `shireen`, `cashier`, `syaz`, and `jermaine`.
If you do not override the seed passwords, all five accounts default to `TARA2026`.
`OPENAI_API_KEY` is only required if you want the Creative Studio to render images directly from the app.
If you use Midjourney, the Creative Studio can still generate the full strategy, prompt pack, aspect guidance, and reference instructions without that key.
For staging, you can also enable a demo login hint with `NEXT_PUBLIC_ENABLE_STAGING_DEMO="true"` and label the UI with `NEXT_PUBLIC_APP_ENV_LABEL="Staging"`.

## Staging environment

Use a separate hosted Postgres database for staging. Start from [.env.staging.example](/Users/vigneshramoo/Documents/TARA/tara-pos/.env.staging.example) and set:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/tara_pos_staging?schema=public&sslmode=require"
NEXT_PUBLIC_APP_URL="https://staging-pos.example.com"
NEXT_PUBLIC_APP_ENV_LABEL="Staging"
NEXT_PUBLIC_ENABLE_STAGING_DEMO="true"
POS_SESSION_SECRET="replace-with-a-long-random-secret"
STAGING_DEMO_PASSWORD="TARADEMO2026"
```

Then bootstrap the staging demo accounts:

```bash
pnpm db:deploy
pnpm db:seed
pnpm staff:bootstrap:staging-demo
```

This creates three staging-only demo users:

- `demo-manager`
- `demo-sales`
- `demo-cashier`

By default they all use `TARADEMO2026`, unless you override `STAGING_DEMO_PASSWORD` or the per-user staging password env vars.
When `NEXT_PUBLIC_ENABLE_STAGING_DEMO="true"`, the login page will show these demo credentials so reviewers can sign in quickly.

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

To replace the old demo catalog in an existing database with the live TARA perfume lineup, use:

```bash
pnpm catalog:sync
```

This keeps past orders intact, deactivates the legacy demo perfumes, and loads the 8 TARA scents at RM169 for 50 mL and RM45 for 8 mL with stock set to 50 each.

If you only need to add or refresh staff accounts without touching products, orders, or customers, use:

```bash
pnpm staff:bootstrap
```

Staff can then change their own password from the in-app `Account` screen after signing in.

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
5. Share staff account credentials only with the team operating the POS.
6. Use `pnpm staff:bootstrap` for live staff setup. `pnpm db:seed` resets the database to the TARA catalog and sample sales data.
7. Use `pnpm catalog:sync` to swap an existing database from the old demo perfumes to the TARA collection without wiping orders or customers.

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
pnpm db:deploy
pnpm lint
pnpm db:push
pnpm db:seed
pnpm catalog:sync
pnpm staff:bootstrap
pnpm staff:bootstrap:staging-demo
pnpm db:studio
```

## Reset the database and reseed

```bash
pnpm db:push
pnpm db:seed
```
