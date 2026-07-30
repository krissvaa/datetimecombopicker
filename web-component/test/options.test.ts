import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
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

function timeColumns(picker: DateTimeComboPicker): HTMLElement {
  return content(picker).shadowRoot!.querySelector('dtcp-time-columns')!;
}

function columnValues(picker: DateTimeComboPicker, column: string): string[] {
  const cells = timeColumns(picker).shadowRoot!.querySelectorAll(`[data-column="${column}"] [role="option"]`);
  return [...cells].map((c) => (c as HTMLElement).dataset.value!);
}

describe('time steps', () => {
  it('generates stepped column items', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker
        format="dd.MM.yyyy HH:mm:ss"
        hour-step="6"
        minute-step="15"
        second-step="30"
      ></date-time-combo-picker>`,
    );
    await open(picker);
    expect(columnValues(picker, 'hours')).to.deep.equal(['0', '6', '12', '18']);
    expect(columnValues(picker, 'minutes')).to.deep.equal(['0', '15', '30', '45']);
    expect(columnValues(picker, 'seconds')).to.deep.equal(['0', '30']);
  });

  it('selects stepped values', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker minute-step="5"></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T13:00:00';
    await open(picker);
    timeColumns(picker).shadowRoot!.querySelector<HTMLElement>('[data-column="minutes"] [data-value="45"]')!.click();
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T13:45:00');
  });

  it('applies steps to the 12h hours column', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker format="h:mm a" hour-step="3"></date-time-combo-picker>`,
    );
    await open(picker);
    // 0,3,6,9 -> displayed as 12,03,06,09
    expect(columnValues(picker, 'hours')).to.deep.equal(['12', '3', '6', '9']);
  });
});

describe('isDateDisabled', () => {
  const disableWeekends = (d: { day: number; month: number; year: number }) =>
    [0, 6].includes(new Date(d.year, d.month, d.day).getDay());

  it('renders disabled date cells', async () => {
    const picker = await pickerFixture();
    picker.isDateDisabled = disableWeekends;
    picker.value = '2026-07-15T12:00:00';
    await open(picker);
    const calendar = content(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
    // 2026-07-18 is a Saturday
    const saturday = [...calendar.shadowRoot!.querySelectorAll<HTMLElement & { date: Date }>('[part~="date"]')].find(
      (cell) => cell.date && cell.date.getDate() === 18,
    )!;
    expect(saturday.getAttribute('part')).to.include('disabled');
  });

  it('blocks keyboard selection of disabled dates', async () => {
    const picker = await pickerFixture();
    picker.isDateDisabled = disableWeekends;
    picker.value = '2026-07-17T12:00:00'; // Friday
    await open(picker);
    const calendar = content(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
    calendar.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true, cancelable: true }),
    ); // Saturday
    calendar.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }),
    );
    await nextFrame();
    expect(picker.value).to.equal('2026-07-17T12:00:00');
  });

  it('makes a disabled-date value invalid', async () => {
    const picker = await pickerFixture();
    picker.isDateDisabled = disableWeekends;
    picker.value = '2026-07-18T12:00:00'; // Saturday
    expect(picker.validate()).to.be.false;
    picker.value = '2026-07-17T12:00:00'; // Friday
    expect(picker.validate()).to.be.true;
  });
});

describe('initialPosition', () => {
  it('seeds the displayed month when there is no value', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker initial-position="2030-01-15T12:30:00"></date-time-combo-picker>`,
    );
    await open(picker);
    const month = content(picker)._displayedMonth;
    expect(month.getFullYear()).to.equal(2030);
    expect(month.getMonth()).to.equal(0);
  });

  it('provides the date and time defaults for the first selection', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker initial-position="2030-01-15T12:30:00"></date-time-combo-picker>`,
    );
    await open(picker);
    // Picking only an hour: date and minutes come from the initial position
    timeColumns(picker).shadowRoot!.querySelector<HTMLElement>('[data-column="hours"] [data-value="9"]')!.click();
    await nextFrame();
    expect(picker.value).to.equal('2030-01-15T09:30:00');
  });

  it('accepts a date-only initial position', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker initial-position="2031-06-01"></date-time-combo-picker>`,
    );
    await open(picker);
    expect(content(picker)._displayedMonth.getFullYear()).to.equal(2031);
  });

  it('is ignored when there is a value', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker initial-position="2030-01-15T12:30:00"></date-time-combo-picker>`,
    );
    picker.value = '2026-07-15T10:00:00';
    await open(picker);
    expect(content(picker)._displayedMonth.getFullYear()).to.equal(2026);
  });
});

describe('action bar (autoApply=false)', () => {
  function actionBar(picker: DateTimeComboPicker): HTMLElement {
    return content(picker).shadowRoot!.querySelector('[part="action-bar"]')!;
  }

  async function stageDateAndTime(picker: DateTimeComboPicker) {
    const calendar = content(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
    calendar.dispatchEvent(
      new CustomEvent('date-tap', { detail: { date: new Date(2026, 6, 20) }, bubbles: true, composed: true }),
    );
    await nextFrame();
    timeColumns(picker).shadowRoot!.querySelector<HTMLElement>('[data-column="hours"] [data-value="9"]')!.click();
    await nextFrame();
  }

  it('hides the action bar by default', async () => {
    const picker = await pickerFixture();
    await open(picker);
    expect(actionBar(picker).hasAttribute('hidden')).to.be.true;
  });

  it('stages selections without changing the value', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker .autoApply="${false}"></date-time-combo-picker>`);
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    expect(actionBar(picker).hasAttribute('hidden')).to.be.false;

    await stageDateAndTime(picker);
    expect(picker.value).to.equal('2026-07-15T13:05:00'); // unchanged
    // The staged selection is reflected in the popup
    expect(content(picker).selectedDate!.getDate()).to.equal(20);
  });

  it('applies the staged selection with OK and closes', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker .autoApply="${false}"></date-time-combo-picker>`);
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    await stageDateAndTime(picker);

    actionBar(picker).querySelector<HTMLElement>('[part="ok-action-button"]')!.click();
    await nextFrame();
    expect(picker.value).to.equal('2026-07-20T09:05:00');
    expect(picker.opened).to.be.false;
  });

  it('discards the staged selection with Cancel', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker .autoApply="${false}"></date-time-combo-picker>`);
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    await stageDateAndTime(picker);

    actionBar(picker).querySelector<HTMLElement>('[part="cancel-action-button"]')!.click();
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T13:05:00');
    expect(picker.opened).to.be.false;

    // Reopening shows the committed value, not the discarded staging
    await open(picker);
    expect(content(picker).selectedDate!.getDate()).to.equal(15);
  });

  it('discards the staged selection when closed without OK', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker .autoApply="${false}"></date-time-combo-picker>`);
    picker.value = '2026-07-15T13:05:00';
    await open(picker);
    await stageDateAndTime(picker);
    picker.close();
    await nextFrame();
    expect(picker.value).to.equal('2026-07-15T13:05:00');
  });

  it('does not close a date-only picker on selection when staging', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker format="dd.MM.yyyy" .autoApply="${false}"></date-time-combo-picker>`,
    );
    await open(picker);
    const calendar = content(picker).shadowRoot!.querySelector('dtcp-month-calendar')!;
    calendar.dispatchEvent(
      new CustomEvent('date-tap', { detail: { date: new Date(2026, 6, 20) }, bubbles: true, composed: true }),
    );
    await nextFrame();
    expect(picker.opened).to.be.true;
    expect(picker.value).to.equal('');
  });
});

describe('fullscreen', () => {
  it('reflects the fullscreen state to the overlay and content', async () => {
    const picker = await pickerFixture();
    (picker as any)._fullscreen = true;
    await nextFrame();
    expect(picker.$.overlay.hasAttribute('fullscreen')).to.be.true;
    expect((picker.$.overlay as any).withBackdrop).to.be.true;
    expect(content(picker).hasAttribute('fullscreen')).to.be.true;
  });
});
