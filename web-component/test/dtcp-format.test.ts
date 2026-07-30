import { expect } from '@open-wc/testing';
import {
  deriveTimeConfig,
  formatDateTime,
  parseDateTime,
  parseIsoDateTime,
  parsePattern,
  toIsoDateTime,
} from '../src/dtcp-format.js';
import type { DateTimeParts } from '../src/dtcp-format.js';

const PARTS: DateTimeParts = { year: 2026, month: 7, day: 30, hours: 13, minutes: 5, seconds: 42 };

describe('parsePattern', () => {
  it('tokenizes a common pattern', () => {
    expect(parsePattern('dd.MM.yyyy HH:mm')).to.deep.equal([
      { type: 'dd' },
      { type: 'literal', literal: '.' },
      { type: 'MM' },
      { type: 'literal', literal: '.' },
      { type: 'yyyy' },
      { type: 'literal', literal: ' ' },
      { type: 'HH' },
      { type: 'literal', literal: ':' },
      { type: 'mm' },
    ]);
  });

  it('supports quoted literals', () => {
    expect(parsePattern("yyyy 'at' HH")).to.deep.equal([
      { type: 'yyyy' },
      { type: 'literal', literal: ' at ' },
      { type: 'HH' },
    ]);
  });

  it('supports escaped single quotes', () => {
    expect(parsePattern("HH''mm")).to.deep.equal([{ type: 'HH' }, { type: 'literal', literal: "'" }, { type: 'mm' }]);
  });

  it('treats unknown letters as literals', () => {
    expect(parsePattern('dQd')).to.deep.equal([{ type: 'd' }, { type: 'literal', literal: 'Q' }, { type: 'd' }]);
  });
});

describe('formatDateTime', () => {
  const fmt = (pattern: string, parts: DateTimeParts = PARTS) => formatDateTime(parsePattern(pattern), parts);

  it('formats 24h patterns', () => {
    expect(fmt('dd.MM.yyyy HH:mm:ss')).to.equal('30.07.2026 13:05:42');
    expect(fmt('d.M.yy H:m:s')).to.equal('30.7.26 13:5:42');
  });

  it('formats 12h patterns', () => {
    expect(fmt('M/d/yyyy h:mm a')).to.equal('7/30/2026 1:05 PM');
    expect(fmt('hh:mm a', { ...PARTS, hours: 0 })).to.equal('12:05 AM');
    expect(fmt('hh:mm a', { ...PARTS, hours: 12 })).to.equal('12:05 PM');
  });

  it('formats date-only and time-only patterns', () => {
    expect(fmt('yyyy-MM-dd')).to.equal('2026-07-30');
    expect(fmt('HH:mm')).to.equal('13:05');
  });
});

describe('parseDateTime', () => {
  const parse = (pattern: string, text: string) => parseDateTime(parsePattern(pattern), text);

  it('parses a full date-time', () => {
    expect(parse('dd.MM.yyyy HH:mm:ss', '30.07.2026 13:05:42')).to.deep.equal(PARTS);
  });

  it('is lenient about digit counts', () => {
    expect(parse('dd.MM.yyyy HH:mm', '3.7.2026 9:5')).to.deep.equal({
      year: 2026,
      month: 7,
      day: 3,
      hours: 9,
      minutes: 5,
      seconds: 0,
    });
  });

  it('is lenient about repeated whitespace', () => {
    expect(parse('dd.MM.yyyy HH:mm', '30.07.2026   13:05')).to.not.equal(null);
  });

  it('windows two-digit years', () => {
    expect(parse('yy', '49')!.year).to.equal(2049);
    expect(parse('yy', '50')!.year).to.equal(1950);
  });

  it('parses 12h patterns with meridiem', () => {
    expect(parse('h:mm a', '1:05 PM')!.hours).to.equal(13);
    expect(parse('h:mm a', '12:00 AM')!.hours).to.equal(0);
    expect(parse('h:mm a', '12:00 PM')!.hours).to.equal(12);
    expect(parse('h:mm a', '1:05 p')!.hours).to.equal(13);
    expect(parse('h:mm a', '1:05 am')!.hours).to.equal(1);
  });

  it('defaults to AM when the 12h pattern has no meridiem token', () => {
    expect(parse('h:mm', '1:05')!.hours).to.equal(1);
    expect(parse('h:mm', '12:05')!.hours).to.equal(0);
  });

  it('rejects malformed text', () => {
    expect(parse('dd.MM.yyyy HH:mm', 'foo')).to.equal(null);
    expect(parse('dd.MM.yyyy HH:mm', '30/07/2026 13:05')).to.equal(null);
    expect(parse('dd.MM.yyyy HH:mm', '30.07.2026')).to.equal(null);
    expect(parse('dd.MM.yyyy HH:mm', '30.07.2026 13:05 extra')).to.equal(null);
  });

  it('rejects out-of-range values', () => {
    expect(parse('HH:mm', '24:00')).to.equal(null);
    expect(parse('HH:mm', '12:60')).to.equal(null);
    expect(parse('dd.MM.yyyy', '32.01.2026')).to.equal(null);
    expect(parse('dd.MM.yyyy', '01.13.2026')).to.equal(null);
    expect(parse('h:mm a', '13:00 PM')).to.equal(null);
  });

  it('rejects invalid calendar dates', () => {
    expect(parse('dd.MM.yyyy', '30.02.2026')).to.equal(null);
    expect(parse('dd.MM.yyyy', '29.02.2024')).to.not.equal(null); // leap year
    expect(parse('dd.MM.yyyy', '29.02.2026')).to.equal(null);
  });

  it('enforces exact digit counts in separator-less patterns', () => {
    expect(parse('HHmm', '0905')).to.deep.include({ hours: 9, minutes: 5 });
    expect(parse('HHmm', '905')).to.equal(null);
  });
});

describe('deriveTimeConfig', () => {
  const config = (pattern: string) => deriveTimeConfig(parsePattern(pattern));

  it('detects all parts in a full pattern', () => {
    expect(config('dd.MM.yyyy HH:mm:ss')).to.deep.equal({
      hasDate: true,
      hasTime: true,
      use12h: false,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      showMeridiem: false,
    });
  });

  it('hides the seconds column without ss', () => {
    expect(config('dd.MM.yyyy HH:mm').showSeconds).to.be.false;
  });

  it('hides the minutes column without mm', () => {
    const c = config('dd.MM.yyyy HH');
    expect(c.showMinutes).to.be.false;
    expect(c.showHours).to.be.true;
  });

  it('uses 12h clock and meridiem column for h/hh', () => {
    const c = config('M/d/yyyy h:mm a');
    expect(c.use12h).to.be.true;
    expect(c.showMeridiem).to.be.true;
  });

  it('detects date-only patterns', () => {
    const c = config('dd.MM.yyyy');
    expect(c.hasDate).to.be.true;
    expect(c.hasTime).to.be.false;
  });

  it('detects time-only patterns', () => {
    const c = config('HH:mm:ss');
    expect(c.hasDate).to.be.false;
    expect(c.hasTime).to.be.true;
  });
});

describe('ISO helpers', () => {
  it('round-trips ISO strings', () => {
    expect(toIsoDateTime(parseIsoDateTime('2026-07-30T13:05:42')!)).to.equal('2026-07-30T13:05:42');
    expect(toIsoDateTime(parseIsoDateTime('2026-07-30T13:05')!)).to.equal('2026-07-30T13:05:00');
  });

  it('rejects malformed ISO strings', () => {
    expect(parseIsoDateTime('2026-07-30')).to.equal(null);
    expect(parseIsoDateTime('2026-13-01T00:00:00')).to.equal(null);
    expect(parseIsoDateTime('2026-02-30T00:00:00')).to.equal(null);
    expect(parseIsoDateTime('garbage')).to.equal(null);
  });
});
