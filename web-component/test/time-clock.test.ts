import { expect, fixture, html, nextFrame, oneEvent } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
import type { DateTimeComboPicker } from '../src/date-time-combo-picker.js';
import type { DtcpOverlayContent } from '../src/dtcp-overlay-content.js';
import type { TimeClock } from '../src/dtcp-time-clock.js';

async function openedPicker(template = html`<date-time-combo-picker auto-apply time-view="clock"></date-time-combo-picker>`) {
  const picker = await fixture<DateTimeComboPicker>(template);
  await nextFrame();
  picker.open();
  await nextFrame();
  await nextFrame();
  return picker;
}

function content(picker: DateTimeComboPicker): DtcpOverlayContent {
  return picker.$.overlayContent as DtcpOverlayContent;
}

function clock(picker: DateTimeComboPicker): TimeClock {
  return content(picker).shadowRoot!.querySelector('dtcp-time-clock')!;
}

function face(picker: DateTimeComboPicker): HTMLElement {
  return clock(picker).shadowRoot!.querySelector('[part="clock-face"]')!;
}

/** Fires pointerdown+up on the face at the given angle (degrees from 12 o'clock) and ring radius fraction. */
function tapFace(picker: DateTimeComboPicker, angleDeg: number, ringRatio = 0.39) {
  const target = face(picker);
  const rect = target.getBoundingClientRect();
  const radius = rect.width * ringRatio;
  const rad = (angleDeg * Math.PI) / 180;
  const x = rect.left + rect.width / 2 + Math.sin(rad) * radius;
  const y = rect.top + rect.height / 2 - Math.cos(rad) * radius;
  const options = { clientX: x, clientY: y, bubbles: true, composed: true, pointerId: 1, buttons: 1 };
  target.dispatchEvent(new PointerEvent('pointerdown', options));
  target.dispatchEvent(new PointerEvent('pointerup', options));
}

describe('dtcp-time-clock', () => {
  it('renders the clock instead of the columns', async () => {
    const picker = await openedPicker();
    expect(clock(picker)).to.not.be.null;
    expect(content(picker).shadowRoot!.querySelector('dtcp-time-columns')).to.be.null;
  });

  it('renders a double ring in 24h mode', async () => {
    const picker = await openedPicker();
    const numbers = clock(picker).shadowRoot!.querySelectorAll('[part~="clock-number"]');
    expect(numbers.length).to.equal(24);
    const inner = clock(picker).shadowRoot!.querySelectorAll('[part~="clock-number-inner"]');
    expect(inner.length).to.equal(12);
  });

  it('renders a single 12-number ring in 12h mode', async () => {
    const picker = await openedPicker(
      html`<date-time-combo-picker auto-apply time-view="clock" format="M/d/yyyy h:mm a"></date-time-combo-picker>`,
    );
    const numbers = clock(picker).shadowRoot!.querySelectorAll('[part~="clock-number"]');
    expect(numbers.length).to.equal(12);
    expect(clock(picker).shadowRoot!.querySelector('[part="meridiem-toggle"]')).to.not.be.null;
  });

  it('selects an hour from the outer ring by pointer', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T00:00:00';
    await nextFrame();
    tapFace(picker, 90); // 3 o'clock, outer ring
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T03:00:00');
  });

  it('selects an inner-ring hour (24h) by pointer', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T00:00:00';
    await nextFrame();
    tapFace(picker, 90, 0.26); // 3 o'clock, inner ring -> 15
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T15:00:00');
  });

  it('advances to the minutes view after selecting an hour', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T00:00:00';
    await nextFrame();
    tapFace(picker, 90);
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    expect((clock(picker) as any)._activeView).to.equal('minutes');
  });

  it('advances immediately with auto-advance-delay 0', async () => {
    const picker = await openedPicker(
      html`<date-time-combo-picker auto-apply time-view="clock" auto-advance-delay="0"></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T00:00:00';
    await nextFrame();
    tapFace(picker, 90);
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect((clock(picker) as any)._activeView).to.equal('minutes');
  });

  it('stays on the hours view when auto-advance is disabled', async () => {
    const picker = await openedPicker(
      html`<date-time-combo-picker auto-apply time-view="clock" auto-advance-disabled></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T00:00:00';
    await nextFrame();
    tapFace(picker, 90);
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    expect((clock(picker) as any)._activeView).to.equal('hours');
    expect(picker.value).to.equal('2026-07-15T03:00:00'); // selection still applied
  });

  it('selects minutes on the minutes view', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T03:00:00';
    await nextFrame();
    const c = clock(picker);
    (c as any)._activeView = 'minutes';
    await nextFrame();
    tapFace(picker, 180); // 6 o'clock -> minute 30
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T03:30:00');
  });

  it('switches views from the readout segments', async () => {
    const picker = await openedPicker();
    const segments = clock(picker).shadowRoot!.querySelectorAll<HTMLElement>('[part~="readout-segment"]');
    expect(segments.length).to.equal(2); // hours, minutes for the default format
    segments[1].click();
    await nextFrame();
    expect((clock(picker) as any)._activeView).to.equal('minutes');
  });

  it('toggles AM/PM from the readout', async () => {
    const picker = await openedPicker(
      html`<date-time-combo-picker auto-apply time-view="clock" format="M/d/yyyy h:mm a"></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T03:00:00';
    await nextFrame();
    const pm = clock(picker).shadowRoot!.querySelectorAll<HTMLElement>('[part~="meridiem-button"]')[1];
    pm.click();
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T15:00:00');
  });

  it('supports keyboard selection on the face', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T03:00:00';
    await nextFrame();
    setTimeout(() =>
      face(picker).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true, cancelable: true }),
      ),
    );
    await oneEvent(clock(picker), 'time-changed');
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T04:00:00');
  });

  it('respects minute steps', async () => {
    const picker = await openedPicker(
      html`<date-time-combo-picker auto-apply time-view="clock" minute-step="15"></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T03:00:00';
    await nextFrame();
    const c = clock(picker);
    (c as any)._activeView = 'minutes';
    await nextFrame();
    // Minute labels only at step multiples
    const labels = [...c.shadowRoot!.querySelectorAll('[part~="clock-number"]')].map((n) => n.textContent!.trim());
    expect(labels).to.deep.equal(['00', '15', '30', '45']);
    // A tap between labels snaps to the nearest step
    tapFace(picker, 150); // 25 minutes -> snaps to 30
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T03:30:00');
  });

  it('uses the reference time for unchosen parts on the first selection', async () => {
    const picker = await openedPicker(
      html`<date-time-combo-picker
        auto-apply
        time-view="clock"
        initial-position="2030-01-15T12:30:00"
      ></date-time-combo-picker>`,
    );
    tapFace(picker, 270); // 9 o'clock, outer ring -> hour 9
    await nextFrame();
    expect(picker.value).to.equal('2030-01-15T09:30:00');
  });

  it('shows the pointed value inside the hand thumb when it has no dial number', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T03:37:00';
    await nextFrame();
    const c = clock(picker);
    (c as any)._activeView = 'minutes';
    await nextFrame();
    const label = c.shadowRoot!.querySelector('[part="clock-hand-label"]');
    expect(label).to.not.be.null;
    expect(label!.textContent!.trim()).to.equal('37');
  });

  it('shows the value inside the hand thumb for on-label values too', async () => {
    const picker = await openedPicker();
    picker.value = '2026-07-15T03:35:00';
    await nextFrame();
    const c = clock(picker);
    (c as any)._activeView = 'minutes';
    await nextFrame();
    const label = c.shadowRoot!.querySelector('[part="clock-hand-label"]');
    expect(label).to.not.be.null;
    expect(label!.textContent!.trim()).to.equal('35');
  });

  it('resets to the hours view when the overlay reopens', async () => {
    const picker = await openedPicker();
    (clock(picker) as any)._activeView = 'minutes';
    picker.close();
    await nextFrame();
    picker.open();
    await nextFrame();
    await nextFrame();
    expect((clock(picker) as any)._activeView).to.equal('hours');
  });
});
