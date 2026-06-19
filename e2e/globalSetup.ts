import {
	migrateToLatest,
	provisionEphemeralPostgres,
} from "./ephemeralPostgres.ts";

// DB safety — the highest-stakes property of this suite.
//
// This setup never touches a developer's database. It picks the test database
// in one of two ways and nothing else:
//   - `TEST_DATABASE_URL` is set (CI): use it verbatim.
//   - otherwise (local default): provision a throwaway Docker Postgres.
// It deliberately ignores any pre-existing `DATABASE_URL`, because under
// `dotenvx --convention=flow` that variable normally carries the *development*
// connection string from `.env.development`.
//
// The chosen test URL is written to `process.env.DATABASE_URL` here, before
// Playwright starts the `webServer`. The server boots with `pnpm start`
// (`dotenvx run --convention=flow -- next start`), and a pre-set `DATABASE_URL`
// overrides `.env.development` under `--convention=flow`. Verified:
//   DATABASE_URL=postgresql://OVERRIDE_WINS@x/y \
//     npx dotenvx run --convention=flow -- node -e 'console.log(process.env.DATABASE_URL)'
//   # prints postgresql://OVERRIDE_WINS@x/y, not the .env.development value
// So the app connects to the test database, never the dev database.
//
// `globalTeardown.ts` tears the container down again; the two files communicate
// through the `E2E_TEARDOWN_*` variables set below (module state does not
// survive between the separate setup and teardown requires).

export default async function globalSetup(): Promise<void> {
	const explicitUrl = process.env["TEST_DATABASE_URL"];
	if (explicitUrl != null && explicitUrl !== "") {
		process.env["DATABASE_URL"] = explicitUrl;
		await migrateToLatest(explicitUrl);
		return;
	}

	const { composeProject, port, databaseUrl } =
		await provisionEphemeralPostgres();
	process.env["DATABASE_URL"] = databaseUrl;
	process.env["E2E_TEARDOWN_COMPOSE_PROJECT"] = composeProject;
	process.env["E2E_TEARDOWN_POSTGRES_PORT"] = String(port);
	await migrateToLatest(databaseUrl);
}
