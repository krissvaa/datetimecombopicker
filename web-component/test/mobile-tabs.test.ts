import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
import type { DateTimeComboPicker } from '../src/date-time-combo-picker.js';
import type { DtcpOverlayContent } from '../src/dtcp-overlay-content.js';

async function openedFullscreenPicker(template = html`<date-time-combo-picker></date-time-combo-picker>`) {
  const picker = await fixture<DateTimeComboPicker>(template);
  (picker as any)._fullscreen = true;
  await nextFrame();
  picker.open();
  await nextFrame();
  await nextFrame();
  return picker;
}

function content(picker: DateTimeComboPicker): DtcpOverlayContent {
  return picker.$.overlayContent as DtcpOverlayContent;
}

function shadow(picker: DateTimeComboPicker): ShadowRoot {
  return content(picker).shadowRoot!;
}

describe('mobile tabs', () => {
  it('shows Date/Time tabs in fullscreen mode with the date tab active', async () => {
    const picker = await openedFullscreenPicker();
    const tabs = shadow(picker).querySelectorAll<HTMLElement>('[part~="tab"]');
    expect(tabs.length).to.equal(2);
    expect(tabs[0].getAttribute('aria-selected')).to.equal('true');
    expect(shadow(picker).querySelector('[part="calendar-section"]')!.hasAttribute('hidden')).to.be.false;
    expect(shadow(picker).querySelector('[part="time-section"]')!.hasAttribute('hidden')).to.be.true;
  });

  it('switches to the time section from the Time tab', async () => {
    const picker = await openedFullscreenPicker();
    shadow(picker).querySelector<HTMLElement>('[part~="time-tab"]')!.click();
    await nextFrame();
    expect(shadow(picker).querySelector('[part="calendar-section"]')!.hasAttribute('hidden')).to.be.true;
    expect(shadow(picker).querySelector('[part="time-section"]')!.hasAttribute('hidden')).to.be.false;
  });

  it('advances to the time tab after selecting a day', async () => {
    const picker = await openedFullscreenPicker();
    shadow(picker)
      .querySelector('dtcp-month-calendar')!
      .dispatchEvent(new CustomEvent('date-tap', { detail: { date: new Date(2026, 6, 15) } }));
    await nextFrame();
    expect((content(picker) as any)._activeTab).to.equal('time');
    expect(shadow(picker).querySelector('[part="time-section"]')!.hasAttribute('hidden')).to.be.false;
  });

  it('shows the formatted value above the tabs while choosing', async () => {
    const picker = await openedFullscreenPicker();
    const header = () => shadow(picker).querySelector('[part="tabs-header"]')!.textContent!.trim();
    // Empty value: the format pattern acts as the placeholder
    expect(header()).to.equal('dd.MM.yyyy HH:mm');
    picker.value = '2026-07-15T03:37:00';
    await nextFrame();
    expect(header()).to.equal('15.07.2026 03:37');
  });

  it('resets to the date tab when the overlay reopens', async () => {
    const picker = await openedFullscreenPicker();
    shadow(picker).querySelector<HTMLElement>('[part~="time-tab"]')!.click();
    picker.close();
    await nextFrame();
    picker.open();
    await nextFrame();
    await nextFrame();
    expect((content(picker) as any)._activeTab).to.equal('date');
  });

  it('renders no tabs on desktop or when disabled', async () => {
    const desktop = await fixture<DateTimeComboPicker>(html`<date-time-combo-picker></date-time-combo-picker>`);
    desktop.open();
    await nextFrame();
    await nextFrame();
    expect(shadow(desktop).querySelector('[part="tabs"]')).to.be.null;

    const stacked = await openedFullscreenPicker(
      html`<date-time-combo-picker mobile-tabs-disabled></date-time-combo-picker>`,
    );
    expect(shadow(stacked).querySelector('[part="tabs"]')).to.be.null;
    expect(shadow(stacked).querySelector('[part="calendar-section"]')!.hasAttribute('hidden')).to.be.false;
    expect(shadow(stacked).querySelector('[part="time-section"]')!.hasAttribute('hidden')).to.be.false;
  });

  it('renders no tabs for a date-only format', async () => {
    const picker = await openedFullscreenPicker(
      html`<date-time-combo-picker format="dd.MM.yyyy"></date-time-combo-picker>`,
    );
    expect(shadow(picker).querySelector('[part="tabs"]')).to.be.null;
  });
});
