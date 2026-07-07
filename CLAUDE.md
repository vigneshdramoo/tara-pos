@AGENTS.md

# TARA POS

Point-of-sale system for TARA. In production use — treat the database and deployments with care.

## Stack

- Next.js 16 (App Router) + TypeScript + React 19
- Tailwind CSS 4
- Prisma 6 + Neon Postgres (production DB in Neon Singapore)
- Deployed on Vercel (project: `tara-pos`, team: `vigneshdramoos-projects`); pushes to `main` auto-deploy to production
- Package manager: pnpm

## Locale

- Timezone: Asia/Kuala_Lumpur (GMT+8). All business logic (daily reports, payouts, shift clocks) is locked to Malaysia time — never use server-local or UTC dates for user-facing day boundaries.
- Currency: MYR.

## Validation (run before considering any change done)

```
./node_modules/.bin/prisma validate
./node_modules/.bin/eslint <changed files>
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/next build
```

## Database safety

- The production database is live. Never run `prisma db push`, `prisma migrate reset`, or destructive migrations without explicit approval.
- Schema changes go through `prisma migrate` with a reviewed migration file — never edit applied migrations.

## Deployment safety

- Every push to `main` deploys to production. For risky changes, work on a branch and use the Vercel preview deployment first.

## Do not touch

- `pnpm-workspace.yaml`
- `reports/` (local only)
- Any unrelated local files, unless explicitly asked.

## Repo

- GitHub: https://github.com/vigneshdramoo/tara-pos
- Local: /Users/vigneshramoo/Documents/TARA/tara-pos
