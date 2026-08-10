import { expect, fixture, html, nextFrame, oneEvent } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
import type { DateTimeComboPicker } from '../src/date-time-combo-picker.js';

async function pickerFixture(template = html`<date-time-combo-picker auto-apply></date-time-combo-picker>`) {
  const picker = await fixture<DateTimeComboPicker>(template);
  await nextFrame();
  return picker;
}

function input(picker: DateTimeComboPicker): HTMLInputElement {
  return picker.querySelector<HTMLInputElement>('input[slot="input"]')!;
}

function overlayContent(picker: DateTimeComboPicker): HTMLElement {
  return picker.$.overlayContent;
}

function monthCalendar(picker: DateTimeComboPicker): HTMLElement {
  return overlayContent(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
}

function timeColumns(picker: DateTimeComboPicker): HTMLElement {
  return overlayContent(picker).shadowRoot!.querySelector('dtcp-time-columns')!;
}

function visibleColumns(picker: DateTimeComboPicker): string[] {
  const columns = timeColumns(picker).shadowRoot!.querySelectorAll<HTMLElement>('[part="column"]');
  return [...columns].map((c) => c.dataset.column!);
}

describe('date-time-combo-picker', () => {
  it('registers the custom element', () => {
    expect(customElements.get('date-time-combo-picker')).to.not.be.undefined;
  });

  it('has a slotted input and a toggle button', async () => {
    const picker = await pickerFixture();
    expect(input(picker)).to.not.be.null;
    expect(picker.$.toggleButton).to.not.be.null;
  });

  it('displays the value using the default format', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-30T13:05:00';
    await nextFrame();
    expect(input(picker).value).to.equal('30.07.2026 13:05');
  });

  it('re-formats the displayed text when the format changes', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-30T13:05:00';
    await nextFrame();
    picker.format = 'M/d/yyyy h:mm a';
    await nextFrame();
    expect(input(picker).value).to.equal('7/30/2026 1:05 PM');
  });

  it('rejects a malformed value', async () => {
    const picker = await pickerFixture();
    picker.value = 'not-a-date';
    await nextFrame();
    expect(picker.value).to.equal('');
  });

  it('commits typed text on change', async () => {
    const picker = await pickerFixture();
    const field = input(picker);
    field.value = '24.12.2026 18:30';
    field.dispatchEvent(new Event('change', { bubbles: true }));
    expect(picker.value).to.equal('2026-12-24T18:30:00');
  });

  it('fires value-changed on commit', async () => {
    const picker = await pickerFixture();
    const field = input(picker);
    setTimeout(() => {
      field.value = '24.12.2026 18:30';
      field.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const event = await oneEvent(picker, 'value-changed');
    expect(event.detail.value).to.equal('2026-12-24T18:30:00');
  });

  it('clears the value but keeps unparseable text and turns invalid', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-30T13:05:00';
    await nextFrame();
    const field = input(picker);
    field.value = 'rubbish';
    field.dispatchEvent(new Event('change', { bubbles: true }));
    expect(picker.value).to.equal('');
    expect(field.value).to.equal('rubbish');
    expect(picker.invalid).to.be.true;
  });

  it('opens and closes the overlay', async () => {
    const picker = await pickerFixture();
    picker.open();
    await nextFrame();
    expect(picker.opened).to.be.true;
    picker.close();
    await nextFrame();
    expect(picker.opened).to.be.false;
  });

  it('does not open when disabled or readonly', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker disabled></date-time-combo-picker>`);
    picker.open();
    expect(picker.opened).to.be.false;

    const readonlyPicker = await pickerFixture(html`<date-time-combo-picker readonly></date-time-combo-picker>`);
    readonlyPicker.open();
    expect(readonlyPicker.opened).to.be.false;
  });

  it('shows hours and minutes columns for the default format', async () => {
    const picker = await pickerFixture();
    picker.open();
    await nextFrame();
    expect(visibleColumns(picker)).to.deep.equal(['hours', 'minutes']);
  });

  it('shows the seconds column when the format has ss', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker format="dd.MM.yyyy HH:mm:ss"></date-time-combo-picker>`,
    );
    picker.open();
    await nextFrame();
    expect(visibleColumns(picker)).to.deep.equal(['hours', 'minutes', 'seconds']);
  });

  it('shows only the hours column when the format has no mm', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker format="dd.MM.yyyy HH"></date-time-combo-picker>`);
    picker.open();
    await nextFrame();
    expect(visibleColumns(picker)).to.deep.equal(['hours']);
  });

  it('shows the meridiem column and 12 hour items for 12h formats', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker format="M/d/yyyy h:mm a"></date-time-combo-picker>`,
    );
    picker.open();
    await nextFrame();
    expect(visibleColumns(picker)).to.deep.equal(['hours', 'minutes', 'meridiem']);
    const hourCells = timeColumns(picker).shadowRoot!.querySelectorAll('[data-column="hours"] [role="option"]');
    expect(hourCells.length).to.equal(12);
  });

  it('hides the time section for date-only formats', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker format="dd.MM.yyyy"></date-time-combo-picker>`);
    picker.open();
    await nextFrame();
    const section = overlayContent(picker).shadowRoot!.querySelector<HTMLElement>('[part="time-section"]')!;
    expect(section.hasAttribute('hidden')).to.be.true;
  });

  it('hides the calendar section for time-only formats', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker format="HH:mm"></date-time-combo-picker>`);
    picker.open();
    await nextFrame();
    const section = overlayContent(picker).shadowRoot!.querySelector<HTMLElement>('[part="calendar-section"]')!;
    expect(section.hasAttribute('hidden')).to.be.true;
  });

  it('selects a date from the calendar and keeps the current time', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-30T13:05:00';
    picker.open();
    await nextFrame();
    await nextFrame();

    const calendar = monthCalendar(picker);
    const dateCell = [...calendar.shadowRoot!.querySelectorAll<HTMLElement & { date: Date }>('[part~="date"]')].find(
      (cell) => cell.date && cell.date.getDate() === 15,
    )!;
    dateCell.click();
    // The forked calendar uses a gesture 'tap' listener; simulate via the event it fires
    calendar.dispatchEvent(
      new CustomEvent('date-tap', { detail: { date: new Date(2026, 6, 15) }, bubbles: true, composed: true }),
    );
    await nextFrame();

    expect(picker.value).to.equal('2026-07-15T13:05:00');
  });

  it('selects a time from the columns and keeps the current date', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-30T13:05:00';
    picker.open();
    await nextFrame();
    await nextFrame();

    const columns = timeColumns(picker);
    const hourCell = columns.shadowRoot!.querySelector<HTMLElement>('[data-column="hours"] [data-value="9"]')!;
    hourCell.click();
    await nextFrame();

    expect(picker.value).to.equal('2026-07-30T09:05:00');
  });

  it('defaults the date to today when a time is picked with no value', async () => {
    const picker = await pickerFixture();
    picker.open();
    await nextFrame();
    await nextFrame();

    const columns = timeColumns(picker);
    columns.shadowRoot!.querySelector<HTMLElement>('[data-column="hours"] [data-value="9"]')!.click();
    await nextFrame();

    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    expect(picker.value).to.equal(
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T09:00:00`,
    );
  });

  it('validates required fields', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker required></date-time-combo-picker>`);
    expect(picker.validate()).to.be.false;
    picker.value = '2026-07-30T13:05:00';
    expect(picker.validate()).to.be.true;
  });

  it('validates min/max', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker min="2026-01-01T00:00" max="2026-12-31T23:59"></date-time-combo-picker>`,
    );
    picker.value = '2027-06-15T10:00:00';
    expect(picker.validate()).to.be.false;
    picker.value = '2026-06-15T10:00:00';
    expect(picker.validate()).to.be.true;
  });

  it('closes the overlay and clears on Escape', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker clear-button-visible></date-time-combo-picker>`);
    picker.value = '2026-07-30T13:05:00';
    picker.open();
    await nextFrame();

    const field = input(picker);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await nextFrame();
    expect(picker.opened).to.be.false;
    expect(picker.value).to.equal('2026-07-30T13:05:00');

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    await nextFrame();
    expect(picker.value).to.equal('');
  });

  it('opens the overlay on ArrowDown', async () => {
    const picker = await pickerFixture();
    input(picker).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await nextFrame();
    expect(picker.opened).to.be.true;
  });
});
