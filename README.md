# Grading Grid

## Development

Start the app with:

```bash
pnpm dev
```

## Postgres Backend

The project now includes a Prisma-backed Postgres setup for persisting grading data.

### Environment variables

The database auth variables live in `.env` and are loaded through `dotenvx` in all database-related scripts.

```bash
POSTGRES_USER=grading
POSTGRES_PASSWORD=grading_dev_password
POSTGRES_DB=grading
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public
```

If you want to manage secrets with dotenvx encryption later, run:

```bash
pnpm exec dotenvx encrypt
```

This will create `.env.keys`, which is already ignored by git.

### Start Postgres

```bash
pnpm db:up
```

Stop it with:

```bash
pnpm db:down
```

### Prisma commands

Validate the schema:

```bash
pnpm prisma:validate
```

Create and apply a local migration:

```bash
pnpm prisma:migrate:dev -- --name init
```

Generate the Prisma client:

```bash
pnpm prisma:generate
```

Open Prisma Studio:

```bash
pnpm prisma:studio
```

## Grading model

Rubric responses are stored as normalized scores from `0` to `1`.

- `0` means the rubric was not satisfied.
- `1` means the rubric was fully satisfied.
- Intermediate values such as `0.25`, `0.5`, or `0.75` support partial credit and future non-binary rubrics.

Rubric weights remain separate from rubric response scores, so weighting can change later without rewriting stored grading decisions.
