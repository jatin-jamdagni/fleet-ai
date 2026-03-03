# Fleet DB Setup (Run Once + Re-run Control)

Use this guide when you want predictable DB initialization behavior.

## Important rule

Run all Docker commands from repo root:

```bash
cd fleet
```

If you run from `apps/backend`, Compose may use the wrong context/project and you can get confusing results.

## How init.sql works

`./scripts/db/init.sql` runs automatically only when Postgres initializes a fresh data volume.

- `docker compose up -d` -> does **not** rerun `init.sql` if volume already exists.
- `docker compose down -v` -> deletes volume; next `up` will run `init.sql` again.

## One-time setup (first time only)

```bash
cd fleet
docker compose up -d --build
```

Verify extensions:

```bash
docker exec fleet_postgres psql -U fleet -d fleetai -c "\\dx"
```

You should see at least:
- `postgis`
- `postgis_topology`
- `vector`
- `pg_trgm`
- `uuid-ossp`

## Normal daily start/stop (no re-init)

Start:

```bash
cd fleet
docker compose up -d
```

Stop:

```bash
cd fleet
docker compose down
```

## Re-run initialization on demand (force clean DB)

Use this only when you intentionally want a fresh DB and re-run `init.sql`:

```bash
cd fleet
docker compose down -v
docker compose up -d --build
```

Then verify:

```bash
docker exec fleet_postgres psql -U fleet -d fleetai -c "\\dx"
```

## Prisma (after DB is up)

```bash
cd fleet/apps/backend
DATABASE_URL="postgresql://fleet:fleet_dev@localhost:5432/fleetai" npx prisma migrate dev --name init
DATABASE_URL="postgresql://fleet:fleet_dev@localhost:5432/fleetai" npx prisma generate
```

## Optional post-migrate SQL

```bash
cd fleet
docker exec -i fleet_postgres psql -U fleet -d fleetai -f /dev/stdin < scripts/db/post_migrate.sql
```

## Quick reset script

```bash
bash scripts/db/reset.sh
```

That script does:
- `docker compose down -v`
- `docker compose up -d --build postgres`
- waits until `pg_isready`

