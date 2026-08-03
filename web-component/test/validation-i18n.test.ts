import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import '../src/date-time-combo-picker-lumo.js';
import { formatDateTime, parseDateTime, parsePattern } from '../src/dtcp-format.js';
import type { DateTimeComboPicker } from '../src/date-time-combo-picker.js';

async function pickerFixture(template = html`<date-time-combo-picker></date-time-combo-picker>`) {
  const picker = await fixture<DateTimeComboPicker>(template);
  await nextFrame();
  return picker;
}

function input(picker: DateTimeComboPicker): HTMLInputElement {
  return picker.querySelector<HTMLInputElement>('input[slot="input"]')!;
}

function commitText(picker: DateTimeComboPicker, text: string) {
  const field = input(picker);
  field.value = text;
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

const FI_MERIDIEMS = { am: 'ap.', pm: 'ip.' };

describe('meridiem localization in the format engine', () => {
  const tokens = parsePattern('h:mm a');
  const parts = { year: 2026, month: 7, day: 30, hours: 15, minutes: 5, seconds: 0 };

  it('formats with localized markers', () => {
    expect(formatDateTime(tokens, parts, FI_MERIDIEMS)).to.equal('3:05 ip.');
    expect(formatDateTime(tokens, { ...parts, hours: 3 }, FI_MERIDIEMS)).to.equal('3:05 ap.');
  });

  it('parses full localized markers case-insensitively', () => {
    expect(parseDateTime(tokens, '3:05 ip.', FI_MERIDIEMS)!.hours).to.equal(15);
    expect(parseDateTime(tokens, '3:05 AP.', FI_MERIDIEMS)!.hours).to.equal(3);
  });

  it('parses unambiguous marker prefixes of any length', () => {
    expect(parseDateTime(tokens, '3:05 i', FI_MERIDIEMS)!.hours).to.equal(15);
    expect(parseDateTime(tokens, '3:05 ip', FI_MERIDIEMS)!.hours).to.equal(15);
    expect(parseDateTime(tokens, '3:05 a', FI_MERIDIEMS)!.hours).to.equal(3);
    expect(parseDateTime(tokens, '3:05 ap', FI_MERIDIEMS)!.hours).to.equal(3);
    const dotted = { am: 'a.m.', pm: 'p.m.' };
    expect(parseDateTime(tokens, '3:05 a.m.', dotted)!.hours).to.equal(3);
    expect(parseDateTime(tokens, '3:05 p.m', dotted)!.hours).to.equal(15);
  });

  it('rejects prefixes shared by both markers', () => {
    const sameFirst = { am: 'x-am', pm: 'x-pm' };
    expect(parseDateTime(tokens, '3:05 x', sameFirst)).to.equal(null);
    expect(parseDateTime(tokens, '3:05 x-', sameFirst)).to.equal(null);
    expect(parseDateTime(tokens, '3:05 x-p', sameFirst)!.hours).to.equal(15);
    expect(parseDateTime(tokens, '3:05 x-am', sameFirst)!.hours).to.equal(3);
  });

  it('handles one marker being a prefix of the other', () => {
    const prefixy = { am: 'a', pm: 'ap' };
    expect(parseDateTime(tokens, '3:05 ap', prefixy)!.hours).to.equal(15);
    expect(parseDateTime(tokens, '3:05 a', prefixy)!.hours).to.equal(3);
  });
});

describe('meridiem localization in the field', () => {
  it('displays the value with localized AM/PM', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker format="h:mm a"></date-time-combo-picker>`);
    picker.i18n = { ...picker.i18n, ...FI_MERIDIEMS };
    picker.value = '2026-07-30T15:05:00';
    await nextFrame();
    expect(input(picker).value).to.equal('3:05 ip.');
  });

  it('re-formats the displayed text when i18n changes', async () => {
    const picker = await pickerFixture(html`<date-time-combo-picker format="h:mm a"></date-time-combo-picker>`);
    picker.value = '2026-07-30T15:05:00';
    await nextFrame();
    expect(input(picker).value).to.equal('3:05 PM');
    picker.i18n = { ...picker.i18n, ...FI_MERIDIEMS };
    await nextFrame();
    expect(input(picker).value).to.equal('3:05 ip.');
  });

  it('parses typed localized AM/PM', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker format="d.M.yyyy h:mm a"></date-time-combo-picker>`,
    );
    picker.i18n = { ...picker.i18n, ...FI_MERIDIEMS };
    await nextFrame();
    commitText(picker, '30.7.2026 3:05 ip.');
    expect(picker.value).to.equal('2026-07-30T15:05:00');
  });
});

describe('per-constraint error messages', () => {
  const MESSAGES = {
    badInputErrorMessage: 'Cannot parse',
    requiredErrorMessage: 'Fill me in',
    minErrorMessage: 'Too early',
    maxErrorMessage: 'Too late',
    dateDisabledErrorMessage: 'Day off',
  };

  async function messagedPicker() {
    const picker = await pickerFixture(
      html`<date-time-combo-picker min="2026-01-01T00:00" max="2026-12-31T23:59"></date-time-combo-picker>`,
    );
    picker.i18n = { ...picker.i18n, ...MESSAGES };
    await nextFrame();
    return picker;
  }

  it('shows the bad-input message for unparseable text', async () => {
    const picker = await messagedPicker();
    commitText(picker, 'rubbish');
    expect(picker.invalid).to.be.true;
    expect((picker as any).errorMessage).to.equal('Cannot parse');
  });

  it('shows min and max messages for out-of-range values', async () => {
    const picker = await messagedPicker();
    picker.value = '2025-06-15T10:00:00';
    picker.validate();
    expect((picker as any).errorMessage).to.equal('Too early');

    picker.value = '2027-06-15T10:00:00';
    picker.validate();
    expect((picker as any).errorMessage).to.equal('Too late');
  });

  it('shows the required message for an empty required field', async () => {
    const picker = await messagedPicker();
    picker.required = true;
    picker.validate();
    expect((picker as any).errorMessage).to.equal('Fill me in');
  });

  it('shows the date-disabled message', async () => {
    const picker = await messagedPicker();
    picker.isDateDisabled = (d) => [0, 6].includes(new Date(d.year, d.month, d.day).getDay());
    picker.value = '2026-07-18T10:00:00'; // Saturday
    picker.validate();
    expect((picker as any).errorMessage).to.equal('Day off');
  });

  it('restores the generic error message when the i18n message is missing', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker
        min="2026-01-01T00:00"
        error-message="Generic problem"
      ></date-time-combo-picker>`,
    );
    picker.i18n = { ...picker.i18n, minErrorMessage: 'Too early' };
    await nextFrame();

    picker.value = '2025-06-15T10:00:00';
    picker.validate();
    expect((picker as any).errorMessage).to.equal('Too early');

    // Bad input has no specific message configured: fall back to generic
    commitText(picker, 'rubbish');
    expect((picker as any).errorMessage).to.equal('Generic problem');
  });

  it('keeps the user-set generic message when nothing specific is configured', async () => {
    const picker = await pickerFixture(
      html`<date-time-combo-picker error-message="Generic problem"></date-time-combo-picker>`,
    );
    commitText(picker, 'rubbish');
    expect(picker.invalid).to.be.true;
    expect((picker as any).errorMessage).to.equal('Generic problem');
  });
});
