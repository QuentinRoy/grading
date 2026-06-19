import { teardownEphemeralPostgres } from "./ephemeralPostgres.ts";

// Tears down the ephemeral Postgres provisioned in `globalSetup.ts`. When the
// suite ran against an external `TEST_DATABASE_URL` (CI), no container was
// created and the teardown variables are absent, so this is a no-op.

export default async function globalTeardown(): Promise<void> {
	const composeProject = process.env["E2E_TEARDOWN_COMPOSE_PROJECT"];
	if (composeProject == null || composeProject === "") {
		return;
	}

	const port = Number(process.env["E2E_TEARDOWN_POSTGRES_PORT"]);
	await teardownEphemeralPostgres({ composeProject, port });
}
