# Pricing Platform: imported MySQL database setup

This procedure is for a **restored local copy** of the existing Pricing database (for example, a TiDB/Dumpling import). It is not a production migration procedure.

## Required environment

Set these variables in the Pricing server environment:

- `DATABASE_URL`: connection string for the intended local MySQL database.
- `PRICING_SSO_SECRET`: the shared SSO signing/verification secret. Use the same value configured in the Sales server environment. Never commit the value.

The SSO secret is an application environment variable; it is not stored in MySQL.

## One-time migration-history reconciliation

The imported schema already contains the tables and columns from migrations 0000-0008, while the imported Drizzle history may contain only migration 0000. Running Drizzle migrations before reconciling that history would replay old CREATE TABLE statements.

From the repository root, run:

```powershell
pnpm install --frozen-lockfile
pnpm db:sync-imported
```

The baseline command is intentionally guarded. It verifies every table created by migrations 0000-0005, the columns introduced by migrations 0006-0008, and that the latest recorded migration is exactly 0000. If any check fails, it stops without writing migration history. It then records 0001-0008 as already applied.

Next apply the pending SSO migration:

```powershell
pnpm drizzle-kit migrate
```

Migration 0009 uses `CREATE TABLE IF NOT EXISTS`, so it is safe if the server's idempotent startup check has already created the SSO token table.

## Validate and run

```powershell
pnpm check
pnpm test
pnpm build
pnpm start
```

The `start` script intentionally does not replay Drizzle migrations automatically. Apply schema changes explicitly after reviewing the target database and migration history.

## SSO deployment checklist

1. Configure the same `PRICING_SSO_SECRET` in Sales and Pricing server environments.
2. Configure Pricing's `DATABASE_URL` to the intended Pricing MySQL database.
3. Restart both applications after changing environment variables.
4. From Sales, open Pricing using the SSO launch action.
5. Verify the redirect, authenticated Pricing session, and one-time-token replay rejection.

Do not paste secret values into source files, GitHub commits, logs, or chat.
