import { teardownEphemeralPostgres } from "./ephemeralPostgres.ts";

// Tears down the ephemeral Postgres provisioned in `playwright.config.ts`
// (see the comment there on why provisioning happens at config-evaluation
// time rather than in a `globalSetup` file). When the suite ran against an
// external `TEST_DATABASE_URL` (CI), no container was created and the
// teardown variables are absent, so this is a no-op.
//
// Playwright runs this before stopping the `webServer` it started (global
// teardown unwinds before plugin teardown), so the production server is still
// connected when the container goes away. That logs a burst of "terminating
// connection due to administrator command" from the app's own pg pool before
// Playwright kills the process — harmless here since the test run has already
// concluded, but it is the same symptom as a real backend-initiated disconnect
// in production (see the follow-up on `src/db/kysely.ts`'s pool error handling).

export default async function globalTeardown(): Promise<void> {
	const composeProject = process.env["E2E_TEARDOWN_COMPOSE_PROJECT"];
	if (composeProject == null || composeProject === "") {
		return;
	}

	const port = Number(process.env["E2E_TEARDOWN_POSTGRES_PORT"]);
	await teardownEphemeralPostgres({ composeProject, port });
}
