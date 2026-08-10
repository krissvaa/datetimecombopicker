import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
import type { DateTimeComboPicker } from '../src/date-time-combo-picker.js';
import type { DtcpOverlayContent } from '../src/dtcp-overlay-content.js';

async function openedPicker(value = '2026-07-15T13:05:00'): Promise<DateTimeComboPicker> {
  const picker = await fixture<DateTimeComboPicker>(html`<date-time-combo-picker auto-apply></date-time-combo-picker>`);
  await nextFrame();
  picker.value = value;
  picker.open();
  await nextFrame();
  await nextFrame();
  return picker;
}

function content(picker: DateTimeComboPicker): DtcpOverlayContent {
  return picker.$.overlayContent as DtcpOverlayContent;
}

function calendar(picker: DateTimeComboPicker): HTMLElement {
  return content(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
}

function key(target: HTMLElement, keyName: string, shiftKey = false) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: keyName, shiftKey, bubbles: true, composed: true, cancelable: true }),
  );
}

function focusedIso(picker: DateTimeComboPicker): string {
  const date = content(picker).focusedDate!;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

describe('calendar keyboard navigation', () => {
  it('initializes the focused date from the value', async () => {
    const picker = await openedPicker();
    expect(focusedIso(picker)).to.equal('2026-07-15');
  });

  it('moves by day and week with arrow keys', async () => {
    const picker = await openedPicker();
    const cal = calendar(picker);
    key(cal, 'ArrowRight');
    expect(focusedIso(picker)).to.equal('2026-07-16');
    key(cal, 'ArrowLeft');
    key(cal, 'ArrowLeft');
    expect(focusedIso(picker)).to.equal('2026-07-14');
    key(cal, 'ArrowDown');
    expect(focusedIso(picker)).to.equal('2026-07-21');
    key(cal, 'ArrowUp');
    key(cal, 'ArrowUp');
    expect(focusedIso(picker)).to.equal('2026-07-07');
  });

  it('moves by month and year with PageDown/PageUp', async () => {
    const picker = await openedPicker();
    const cal = calendar(picker);
    key(cal, 'PageDown');
    expect(focusedIso(picker)).to.equal('2026-08-15');
    key(cal, 'PageUp');
    key(cal, 'PageUp');
    expect(focusedIso(picker)).to.equal('2026-06-15');
    key(cal, 'PageDown', true);
    expect(focusedIso(picker)).to.equal('2027-06-15');
    key(cal, 'PageUp', true);
    key(cal, 'PageUp', true);
    expect(focusedIso(picker)).to.equal('2025-06-15');
  });

  it('clamps the day when the target month is shorter', async () => {
    const picker = await openedPicker('2026-01-31T00:00:00');
    const cal = calendar(picker);
    key(cal, 'PageDown');
    expect(focusedIso(picker)).to.equal('2026-02-28');
  });

  it('jumps to first/last day of the month with Home/End', async () => {
    const picker = await openedPicker();
    const cal = calendar(picker);
    key(cal, 'Home');
    expect(focusedIso(picker)).to.equal('2026-07-01');
    key(cal, 'End');
    expect(focusedIso(picker)).to.equal('2026-07-31');
  });

  it('updates the displayed month when navigating across months', async () => {
    const picker = await openedPicker('2026-07-31T00:00:00');
    const cal = calendar(picker);
    key(cal, 'ArrowRight');
    expect(focusedIso(picker)).to.equal('2026-08-01');
    const m = content(picker)._displayedMonth;
    expect(m.getMonth()).to.equal(7); // August
  });

  it('selects the focused date with Enter, keeping the time', async () => {
    const picker = await openedPicker();
    const cal = calendar(picker);
    key(cal, 'ArrowRight');
    key(cal, 'Enter');
    await nextFrame();
    expect(picker.value).to.equal('2026-07-16T13:05:00');
  });

  it('selects the focused date with Space', async () => {
    const picker = await openedPicker();
    const cal = calendar(picker);
    key(cal, 'ArrowDown');
    key(cal, ' ');
    await nextFrame();
    expect(picker.value).to.equal('2026-07-22T13:05:00');
  });

  it('does not select dates outside min/max with Enter', async () => {
    const picker = await openedPicker();
    picker.min = '2026-07-01T00:00';
    picker.max = '2026-07-31T23:59';
    await nextFrame();
    const cal = calendar(picker);
    key(cal, 'End');
    key(cal, 'ArrowRight'); // Aug 1, out of range
    key(cal, 'Enter');
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T13:05:00');
  });

  it('focuses a date cell in the calendar via focusDateCell()', async () => {
    const picker = await openedPicker();
    await content(picker).focusDateCell();
    const cal = calendar(picker);
    const active = cal.shadowRoot!.activeElement as HTMLElement | null;
    expect(active).to.not.be.null;
    expect(active!.getAttribute('part')).to.include('date');
  });

  it('keeps the field focused state while focus is inside the overlay', async () => {
    const picker = await openedPicker();
    const overlay = picker.$.overlay;
    const fakeRelated = overlay.firstElementChild as Node; // overlay content
    expect(picker._shouldRemoveFocus(new FocusEvent('focusout', { relatedTarget: fakeRelated }))).to.be.false;
    // Transient blur (focused popup element re-rendered away) keeps focus
    expect(picker._shouldRemoveFocus(new FocusEvent('focusout', { relatedTarget: document.body }))).to.be.false;
    expect(picker._shouldRemoveFocus(new FocusEvent('focusout', { relatedTarget: null }))).to.be.false;
    // A real element outside the field and popup removes it
    expect(picker._shouldRemoveFocus(new FocusEvent('focusout', { relatedTarget: document.head }))).to.be.true;
    // When the popup is closed, any focusout blurs
    picker.close();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(picker._shouldRemoveFocus(new FocusEvent('focusout', { relatedTarget: document.body }))).to.be.true;
  });
});

describe('year navigation', () => {
  function yearGrid(picker: DateTimeComboPicker): HTMLElement | null {
    return content(picker).shadowRoot!.querySelector('[part="year-grid"]');
  }

  it('opens the year grid from the month-year header', async () => {
    const picker = await openedPicker();
    const label = content(picker).shadowRoot!.querySelector<HTMLElement>('[part="month-year-label"]')!;
    expect(yearGrid(picker)).to.be.null;
    label.click();
    await nextFrame();
    expect(yearGrid(picker)).to.not.be.null;
    expect(label.getAttribute('aria-expanded')).to.equal('true');
    const selected = yearGrid(picker)!.querySelector('[part~="year-cell-selected"]')!;
    expect(selected.textContent!.trim()).to.equal('2026');
  });

  it('selects a year and returns to the month view', async () => {
    const picker = await openedPicker();
    const contentEl = content(picker);
    contentEl.shadowRoot!.querySelector<HTMLElement>('[part="month-year-label"]')!.click();
    await nextFrame();
    yearGrid(picker)!.querySelector<HTMLElement>('[data-year="1987"]')!.click();
    await nextFrame();
    expect(yearGrid(picker)).to.be.null;
    expect(contentEl._displayedMonth.getFullYear()).to.equal(1987);
    expect(contentEl._displayedMonth.getMonth()).to.equal(6); // July preserved
    expect(contentEl.focusedDate!.getFullYear()).to.equal(1987);
  });

  it('resets to the month view when reopened', async () => {
    const picker = await openedPicker();
    content(picker).shadowRoot!.querySelector<HTMLElement>('[part="month-year-label"]')!.click();
    await nextFrame();
    picker.close();
    await nextFrame();
    picker.open();
    await nextFrame();
    await nextFrame();
    expect(yearGrid(picker)).to.be.null;
  });
});
