import { defineConfig, devices } from "@playwright/test";

// Standalone Playwright runner for the end-to-end grading smoke test. It is
// separate from the Storybook Vitest browser project: this suite drives the
// real Next.js production server against a real Postgres. See
// `docs/reference/testing-conventions.md`.

const isCi = process.env["CI"] != null && process.env["CI"] !== "";

// Dedicated port, not the dev server's 3000. With `reuseExistingServer` enabled
// locally, sharing 3000 would let Playwright reuse a running `next dev` — which
// is wired to the development database — for the E2E run. A separate port means
// only a server this suite started is ever reused.
const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: "e2e",
	// A single, strictly sequential happy-path smoke test.
	fullyParallel: false,
	workers: 1,
	forbidOnly: isCi,
	retries: isCi ? 2 : 0,
	reporter: isCi ? [["list"], ["html", { open: "never" }]] : "list",
	globalSetup: "./e2e/globalSetup.ts",
	globalTeardown: "./e2e/globalTeardown.ts",
	use: { baseURL, trace: "on-first-retry", video: "retain-on-failure" },
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		// Production server. `next dev` short-circuits the Next.js caches, so it
		// would not exercise the cache-invalidation paths this test exists to
		// prove. A build must already exist (`pnpm build`); CI builds first.
		// `globalSetup` has already set `DATABASE_URL` to the test database, and
		// dotenvx (`--convention=flow`) keeps that pre-set value over
		// `.env.development`.
		command: "pnpm start",
		url: baseURL,
		env: { PORT: String(port) },
		reuseExistingServer: !isCi,
		timeout: 120_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});
