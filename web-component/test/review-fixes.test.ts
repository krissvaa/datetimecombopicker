import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
import { parseIsoDateTime } from '../src/dtcp-format.js';
import type { DateTimeComboPicker } from '../src/date-time-combo-picker.js';
import type { DtcpOverlayContent } from '../src/dtcp-overlay-content.js';

async function pickerFixture(template = html`<date-time-combo-picker></date-time-combo-picker>`) {
  const picker = await fixture<DateTimeComboPicker>(template);
  await nextFrame();
  return picker;
}

async function open(picker: DateTimeComboPicker) {
  picker.open();
  await nextFrame();
  await nextFrame();
}

function content(picker: DateTimeComboPicker): DtcpOverlayContent {
  return picker.$.overlayContent as DtcpOverlayContent;
}

function key(target: HTMLElement, keyName: string) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: keyName, bubbles: true, composed: true, cancelable: true }),
  );
}

describe('overlay outside-click ownership', () => {
  // The overlay's outside-click detection is a capture-phase click listener
  function outsideClick(target: EventTarget) {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  }

  it('does not treat clicks on the field as outside clicks', async () => {
    const picker = await pickerFixture();
    await open(picker);
    outsideClick(picker.$.inputContainer);
    await nextFrame();
    expect(picker.opened).to.be.true;
  });

  it('closes on a genuine outside click', async () => {
    const picker = await pickerFixture();
    await open(picker);
    outsideClick(document.body);
    await nextFrame();
    expect(picker.opened).to.be.false;
  });

  it('closes the fullscreen sheet on a backdrop click', async () => {
    const picker = await pickerFixture();
    (picker as any)._fullscreen = true;
    await nextFrame();
    await open(picker);
    const backdrop = picker.$.overlay.shadowRoot!.querySelector('[part="backdrop"]')!;
    outsideClick(backdrop);
    await nextFrame();
    expect(picker.opened).to.be.false;
  });

  it('keeps a staged selection when clicking into the field', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker .autoApply="${false}"></date-time-combo-picker>`);
    await open(picker);
    const calendar = content(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
    calendar.dispatchEvent(
      new CustomEvent('date-tap', { detail: { date: new Date(2026, 6, 20) }, bubbles: true, composed: true }),
    );
    await nextFrame();
    outsideClick(picker.$.inputContainer);
    await nextFrame();
    expect(picker.opened).to.be.true;
    expect(content(picker).selectedDate!.getDate()).to.equal(20);
  });
});

describe('fullscreen flip while open', () => {
  it('drops stale inline anchoring when entering fullscreen and re-anchors on the way out', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    const overlay = picker.$.overlay as HTMLElement & { _updatePosition(): void };
    // Popup mode: the position mixin anchors with inline styles
    overlay._updatePosition();
    expect(overlay.style.top).to.not.equal('');

    // Rotating across the threshold: the resize tick repositioned already
    // (above); then the media query flips fullscreen — the stale inline
    // anchoring must not beat the bottom-sheet stylesheet
    (picker as any)._fullscreen = true;
    await nextFrame();
    expect(overlay.hasAttribute('fullscreen')).to.be.true;
    expect(overlay.style.top).to.equal('');
    expect(overlay.style.justifyContent).to.equal('');

    // Flipping back must re-anchor to the field, not leave the popup
    // floating at the default flex position
    (picker as any)._fullscreen = false;
    await nextFrame();
    expect(overlay.hasAttribute('fullscreen')).to.be.false;
    expect(overlay.style.top).to.not.equal('');
  });
});

describe('keyboard selection on range boundaries', () => {
  it('selects the max-boundary day with Enter when the value has a time', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker auto-apply min="2026-07-01T00:00" max="2026-07-31T23:59"></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    const calendar = content(picker).shadowRoot!.querySelector<HTMLElement>('dtcp-month-calendar')!;
    key(calendar, 'End'); // Jul 31
    key(calendar, 'Enter');
    await nextFrame();
    expect(picker.value).to.equal('2026-07-31T13:05:00');
  });
});

describe('Today button respects constraints', () => {
  it('is disabled and inert when today is outside min/max', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker min="1990-01-01T00:00" max="1990-12-31T23:59"></date-time-combo-picker>`,
    );
    await open(picker);
    const today = content(picker).shadowRoot!.querySelector<HTMLButtonElement>('[part="today-button"]')!;
    expect(today.disabled).to.be.true;
    today.click();
    await nextFrame();
    expect(picker.value).to.equal('');
  });

  it('stays enabled when today is allowed', async () => {
    const picker = await pickerFixture();
    await open(picker);
    const today = content(picker).shadowRoot!.querySelector<HTMLButtonElement>('[part="today-button"]')!;
    expect(today.disabled).to.be.false;
  });
});

describe('clear button', () => {
  it('does not open the popup', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker clear-button-visible></date-time-combo-picker>`);
    picker.value = '2026-07-15T13:05:00';
    await nextFrame();
    (picker.$.clearButton as HTMLElement).click();
    await nextFrame();
    expect(picker.value).to.equal('');
    expect(picker.opened).to.be.false;
  });
});

describe('constraint changes revalidate', () => {
  it('clears the invalid state when min is relaxed', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker min="2027-01-01T00:00"></date-time-combo-picker>`);
    picker.value = '2026-07-15T13:05:00';
    picker.validate();
    expect(picker.invalid).to.be.true;
    picker.min = '2026-01-01T00:00';
    await nextFrame();
    expect(picker.invalid).to.be.false;
  });

  it('marks the value invalid when max is tightened', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-15T13:05:00';
    await nextFrame();
    picker.max = '2026-01-01T00:00';
    await nextFrame();
    expect(picker.invalid).to.be.true;
  });
});

describe('opened guard and ARIA', () => {
  it('ignores opened=true while disabled', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker disabled></date-time-combo-picker>`);
    picker.opened = true;
    await nextFrame();
    expect(picker.opened).to.be.false;
  });

  it('exposes combobox popup semantics on the input', async () => {
    const picker = await pickerFixture();
    const input = picker.querySelector('input')!;
    expect(input.getAttribute('role')).to.equal('combobox');
    expect(input.getAttribute('aria-haspopup')).to.equal('dialog');
    expect(input.getAttribute('aria-expanded')).to.equal('false');
    await open(picker);
    expect(input.getAttribute('aria-expanded')).to.equal('true');
    expect(content(picker).getAttribute('role')).to.equal('dialog');
  });
});

describe('year grid keyboard navigation', () => {
  it('moves with arrows and selects with Enter via the roving tabindex', async () => {
    const picker = await pickerFixture();
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    const contentEl = content(picker);
    contentEl.shadowRoot!.querySelector<HTMLElement>('[part="month-year-label"]')!.click();
    await nextFrame();

    const grid = contentEl.shadowRoot!.querySelector<HTMLElement>('[part="year-grid"]')!;
    const selected = grid.querySelector<HTMLElement>('[part~="year-cell-selected"]')!;
    expect(selected.getAttribute('tabindex')).to.equal('0');

    // ArrowDown moves 4 years ahead (one row)
    selected.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true, cancelable: true }),
    );
    await nextFrame();
    const active = contentEl.shadowRoot!.activeElement as HTMLElement;
    expect(active.dataset.year).to.equal('2030');
  });
});

describe('strict ISO parsing', () => {
  it('rejects timezone designators and sub-second precision', () => {
    expect(parseIsoDateTime('2026-07-30T13:30:00Z')).to.equal(null);
    expect(parseIsoDateTime('2026-07-30T13:30:00+02:00')).to.equal(null);
    expect(parseIsoDateTime('2026-07-30T13:30:00.123')).to.equal(null);
    expect(parseIsoDateTime('2026-07-30T13:30:00garbage')).to.equal(null);
    expect(parseIsoDateTime('2026-07-30T13:30:00')).to.not.equal(null);
    expect(parseIsoDateTime('2026-07-30T13:30')).to.not.equal(null);
  });
});
