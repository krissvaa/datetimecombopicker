import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Integration tests driving the Flow demo app (DemoView) in Chromium.
 *
 * Note: when the popup is open, its <dtcp-overlay> element is moved to
 * <body>, so overlay content is located globally, not under the picker.
 */

function openOverlay(page: Page): Locator {
  return page.locator('dtcp-overlay[opened]');
}

function pickerValue(picker: Locator): Promise<string> {
  return picker.evaluate((el: any) => el.value);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('date-time-combo-picker input');
});

test('demo page shows all pickers', async ({ page }) => {
  await expect(page.locator('date-time-combo-picker')).toHaveCount(7);
});

test('mouse: pick a date and a time in one popup', async ({ page }) => {
  const picker = page.locator('date-time-combo-picker').first();
  await picker.locator('input').click();

  const overlay = openOverlay(page);
  await expect(overlay).toBeVisible();

  // Click day 15 in the calendar (real click goes through the gesture 'tap')
  await overlay
    .locator('dtcp-month-calendar [part~="date"]:not([part~="disabled"])')
    .filter({ hasText: /^15$/ })
    .click();

  // Click hour 09 and minute 30 in the time columns
  await overlay.locator('[data-column="hours"] [data-value="9"]').click();
  await overlay.locator('[data-column="minutes"] [data-value="30"]').click();

  const value = await pickerValue(picker);
  expect(value).toMatch(/^\d{4}-\d{2}-15T09:30:00$/);
  await expect(picker.locator('input')).toHaveValue(/^15\.\d{2}\.\d{4} 09:30$/);
});

test('typing commits through the format parser', async ({ page }) => {
  const picker = page.locator('date-time-combo-picker').first();
  const input = picker.locator('input');
  await input.click();
  await input.fill('24.12.2026 18:45');
  await input.press('Enter');
  expect(await pickerValue(picker)).toBe('2026-12-24T18:45:00');
});

test('keyboard: navigate the calendar and select with Enter', async ({ page }) => {
  const picker = page.locator('date-time-combo-picker').first();
  const input = picker.locator('input');
  await input.click();
  await input.fill('15.07.2026 12:00');
  await input.press('Enter');

  await input.press('ArrowDown'); // opens the popup
  await expect(openOverlay(page)).toBeVisible();
  await input.press('ArrowDown'); // moves focus into the calendar

  await page.keyboard.press('ArrowRight'); // Jul 16
  await page.keyboard.press('ArrowDown'); // Jul 23
  await page.keyboard.press('Enter');
  expect(await pickerValue(picker)).toBe('2026-07-23T12:00:00');

  await page.keyboard.press('Escape'); // closes and restores focus
  await expect(openOverlay(page)).toHaveCount(0);
  await expect(input).toBeFocused();
});

test('year navigation via the month-year header', async ({ page }) => {
  const picker = page.locator('date-time-combo-picker').first();
  await picker.locator('input').click();

  const overlay = openOverlay(page);
  const header = overlay.locator('[part="month-year-label"]');
  await header.click();

  const grid = overlay.locator('[part="year-grid"]');
  await expect(grid).toBeVisible();
  await grid.locator('[data-year="1987"]').click();

  await expect(overlay.locator('dtcp-month-calendar')).toBeVisible();
  await expect(header).toContainText('1987');
});

test('12h format shows hours, minutes and AM/PM columns', async ({ page }) => {
  const picker12 = page.locator('date-time-combo-picker').nth(2);
  await picker12.locator('input').click();

  const overlay = openOverlay(page);
  await expect(overlay.locator('[part="column"]')).toHaveCount(3);
  await expect(overlay.locator('[data-column="hours"] [role="option"]')).toHaveCount(12);
  await expect(overlay.locator('[data-column="meridiem"]')).toBeVisible();
});

test('hours-only format shows a single time column', async ({ page }) => {
  const picker = page.locator('date-time-combo-picker').nth(3);
  await picker.locator('input').click();

  const overlay = openOverlay(page);
  await expect(overlay.locator('[part="column"]')).toHaveCount(1);
});

test('Binder round-trip: required validation and server value', async ({ page }) => {
  const validate = page.getByRole('button', { name: 'Validate' });
  await validate.click();
  await expect(page.getByText('Validation failed')).toBeVisible();

  const bound = page.locator('date-time-combo-picker').last();
  const input = bound.locator('input');
  await input.click();
  await input.fill('01.02.2026 08:15');
  await input.press('Enter');
  await page.keyboard.press('Escape'); // close popup so the click lands on the button
  await validate.click();
  await expect(page.getByText('Saved: 2026-02-01T08:15')).toBeVisible();
});

test('min/max marks out-of-range typed values invalid', async ({ page }) => {
  const picker = page.locator('date-time-combo-picker').nth(4);
  const input = picker.locator('input');
  await input.click();
  await input.fill('15.06.2027 10:00');
  await input.press('Enter');
  await page.keyboard.press('Escape');
  await expect(picker).toHaveAttribute('invalid', '');

  await input.click();
  await input.fill('15.06.2026 10:00');
  await input.press('Enter');
  expect(await pickerValue(picker)).toBe('2026-06-15T10:00:00');
  await expect(picker).not.toHaveAttribute('invalid', '');
});
