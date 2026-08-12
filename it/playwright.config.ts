import { defineConfig, devices } from '@playwright/test';

/**
 * Integration tests against the Flow demo application.
 *
 * The Vaadin version for the demo server can be overridden with the
 * VAADIN_VERSION environment variable (defaults to the add-on's minimum
 * supported platform version, 25.1.11 — the same version the CI matrix
 * exercises alongside the latest).
 *
 * Set VAADIN_PRODUCTION=true to run the demo in production mode. Dev mode
 * requires a signed-in Vaadin account (license checker) on every supported
 * version, which blocks headless runs: CI always sets this, and local runs
 * without a signed-in account need it too.
 */
const vaadinVersion = process.env.VAADIN_VERSION ?? '25.1.11';
const productionMode = process.env.VAADIN_PRODUCTION === 'true';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: `mvn -f ../flow/pom.xml jetty:run -B -ntp -Dvaadin.version=${vaadinVersion}${
      productionMode ? ' -Pproduction' : ''
    }`,
    url: 'http://localhost:8080',
    // First run downloads Maven + npm dependencies and builds the dev bundle
    timeout: 900_000,
    reuseExistingServer: !process.env.CI,
    // Maven reports build errors on stdout; without piping it, a failed
    // server start on CI gives no clue at all
    stdout: process.env.CI ? 'pipe' : 'ignore',
    stderr: 'pipe',
  },
});
