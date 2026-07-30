import { defineConfig, devices } from '@playwright/test';

/**
 * Integration tests against the Flow demo application.
 *
 * The Vaadin version for the demo server can be overridden with the
 * VAADIN_VERSION environment variable (defaults to the add-on's minimum
 * supported platform version).
 */
const vaadinVersion = process.env.VAADIN_VERSION ?? '24.4.20';

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
    command: `mvn -f ../flow/pom.xml jetty:run -B -ntp -Dvaadin.version=${vaadinVersion}`,
    url: 'http://localhost:8080',
    // First run downloads Maven + npm dependencies and builds the dev bundle
    timeout: 900_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
