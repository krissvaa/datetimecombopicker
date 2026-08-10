import { test } from '@playwright/test';

/**
 * On the first request after a frontend change, Vaadin dev mode serves a
 * "Building front-end development bundle" splash while it rebuilds. This
 * setup project waits until the real demo view is served, so the actual
 * tests start against a ready application.
 */
test('wait for the demo application to be ready', async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto('/');
  await page.waitForSelector('date-time-combo-picker input', { timeout: 600_000 });
});
