/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 */

/**
 * A minimal date-time format engine supporting a subset of the
 * java.time / SimpleDateFormat pattern letters:
 *
 *   yyyy  4-digit year            yy  2-digit year (windowed 1950-2049)
 *   MM    2-digit month           M   1-2 digit month
 *   dd    2-digit day             d   1-2 digit day
 *   HH    2-digit hour (0-23)     H   1-2 digit hour (0-23)
 *   hh    2-digit hour (1-12)     h   1-2 digit hour (1-12)
 *   mm    2-digit minute          m   1-2 digit minute
 *   ss    2-digit second          s   1-2 digit second
 *   a     AM/PM marker
 *
 * Any other character is treated as a literal. Single quotes escape
 * literal text ('at'), and '' is an escaped single quote.
 */

export type TokenType =
  | 'yyyy'
  | 'yy'
  | 'MM'
  | 'M'
  | 'dd'
  | 'd'
  | 'HH'
  | 'H'
  | 'hh'
  | 'h'
  | 'mm'
  | 'm'
  | 'ss'
  | 's'
  | 'a'
  | 'literal';

export interface Token {
  type: TokenType;
  /** Literal text, only present for 'literal' tokens. */
  literal?: string;
}

/** Plain date-time parts. `month` is 1-based (1 = January). `hours` is 0-23. */
export interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Which parts of the popup UI the pattern enables. */
export interface TimeConfig {
  /** Pattern contains any of y/M/d tokens: show the calendar. */
  hasDate: boolean;
  /** Pattern contains any hour/minute/second/meridiem tokens: show the time section. */
  hasTime: boolean;
  /** Pattern uses 12-hour clock (h/hh present). */
  use12h: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  /** Show the AM/PM column ('a' present, or a 12h hour token without 'a'). */
  showMeridiem: boolean;
}

const PATTERN_TOKENS: TokenType[] = [
  'yyyy',
  'yy',
  'MM',
  'M',
  'dd',
  'd',
  'HH',
  'H',
  'hh',
  'h',
  'mm',
  'm',
  'ss',
  's',
  'a',
];

/** Localizable AM/PM marker strings used by the `a` pattern token. */
export interface MeridiemStrings {
  am: string;
  pm: string;
}

const DEFAULT_MERIDIEMS: MeridiemStrings = { am: 'AM', pm: 'PM' };

/**
 * Tokenizes a format pattern string. Unknown pattern letters and other
 * characters become literal tokens; quoted sections are always literal.
 */
export function parsePattern(pattern: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const pushLiteral = (text: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.type === 'literal') {
      last.literal! += text;
    } else {
      tokens.push({ type: 'literal', literal: text });
    }
  };

  while (i < pattern.length) {
    const ch = pattern[i];

    // Quoted literal section
    if (ch === "'") {
      if (pattern[i + 1] === "'") {
        pushLiteral("'");
        i += 2;
        continue;
      }
      const end = pattern.indexOf("'", i + 1);
      if (end === -1) {
        pushLiteral(pattern.slice(i + 1));
        i = pattern.length;
      } else {
        pushLiteral(pattern.slice(i + 1, end));
        i = end + 1;
      }
      continue;
    }

    // Pattern tokens, longest match first
    const match = PATTERN_TOKENS.find((t) => pattern.startsWith(t, i));
    if (match) {
      tokens.push({ type: match });
      i += match.length;
      continue;
    }

    pushLiteral(ch);
    i += 1;
  }

  return tokens;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/** Formats date-time parts using the given tokens and AM/PM strings. */
export function formatDateTime(
  tokens: Token[],
  parts: DateTimeParts,
  meridiems: MeridiemStrings = DEFAULT_MERIDIEMS,
): string {
  const hour12 = parts.hours % 12 === 0 ? 12 : parts.hours % 12;
  return tokens
    .map((token) => {
      switch (token.type) {
        case 'yyyy':
          return pad(parts.year, 4);
        case 'yy':
          return pad(parts.year % 100, 2);
        case 'MM':
          return pad(parts.month, 2);
        case 'M':
          return String(parts.month);
        case 'dd':
          return pad(parts.day, 2);
        case 'd':
          return String(parts.day);
        case 'HH':
          return pad(parts.hours, 2);
        case 'H':
          return String(parts.hours);
        case 'hh':
          return pad(hour12, 2);
        case 'h':
          return String(hour12);
        case 'mm':
          return pad(parts.minutes, 2);
        case 'm':
          return String(parts.minutes);
        case 'ss':
          return pad(parts.seconds, 2);
        case 's':
          return String(parts.seconds);
        case 'a':
          return parts.hours < 12 ? meridiems.am : meridiems.pm;
        case 'literal':
          return token.literal ?? '';
        default:
          return '';
      }
    })
    .join('');
}

interface ParseState {
  text: string;
  pos: number;
}

function readDigits(state: ParseState, minLen: number, maxLen: number): number | null {
  let len = 0;
  while (len < maxLen && /[0-9]/.test(state.text[state.pos + len] ?? '')) {
    len += 1;
  }
  if (len < minLen) {
    return null;
  }
  const value = parseInt(state.text.slice(state.pos, state.pos + len), 10);
  state.pos += len;
  return value;
}

/**
 * Matches a localized AM/PM marker at the given position. A complete marker
 * (case-insensitive) always wins; otherwise any partial prefix of a marker
 * is accepted as long as it does not equally match the other marker
 * (e.g. with markers `ap.`/`ip.`, the inputs `a`, `ap`, `i` and `ip` all
 * resolve, while markers `x-am`/`x-pm` require at least `x-a`/`x-p`).
 * Returns the matched meridiem and its consumed length, or null.
 */
function matchMeridiem(
  text: string,
  pos: number,
  meridiems: MeridiemStrings,
): { meridiem: 'am' | 'pm'; length: number } | null {
  const rest = text.slice(pos).toLowerCase();
  const am = meridiems.am.toLowerCase();
  const pm = meridiems.pm.toLowerCase();

  // Complete markers take precedence, longest first so that one marker
  // being a prefix of the other still resolves correctly
  const full: Array<{ meridiem: 'am' | 'pm'; marker: string }> = [
    { meridiem: 'am' as const, marker: am },
    { meridiem: 'pm' as const, marker: pm },
  ].sort((a, b) => b.marker.length - a.marker.length);
  for (const { meridiem, marker } of full) {
    if (marker && rest.startsWith(marker)) {
      return { meridiem, length: marker.length };
    }
  }

  // Partial prefixes, longest first; both matching means the prefixes are
  // identical, and every shorter prefix would be equally ambiguous
  for (let length = Math.max(am.length, pm.length) - 1; length >= 1; length--) {
    const amMatches = length < am.length && rest.startsWith(am.slice(0, length));
    const pmMatches = length < pm.length && rest.startsWith(pm.slice(0, length));
    if (amMatches && pmMatches) {
      return null;
    }
    if (amMatches) {
      return { meridiem: 'am', length };
    }
    if (pmMatches) {
      return { meridiem: 'pm', length };
    }
  }
  return null;
}

/**
 * Parses text against the given tokens. Returns null when the text does not
 * match the pattern or contains out-of-range values. Parsing is strict about
 * literals but lenient about digit counts: 2-digit tokens accept 1-2 digits
 * (except when directly followed by another numeric token), and yyyy accepts
 * 1-4 digits. Two-digit years are windowed to 1950-2049. AM/PM markers are
 * matched against the given localized strings.
 */
export function parseDateTime(
  tokens: Token[],
  text: string,
  meridiems: MeridiemStrings = DEFAULT_MERIDIEMS,
): DateTimeParts | null {
  const state: ParseState = { text: text.trim(), pos: 0 };

  // Defaults when the pattern omits parts
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let hour12: number | null = null;
  let meridiem: 'am' | 'pm' | null = null;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    // When a numeric token is directly followed by another non-literal token
    // (e.g. "HHmm"), enforce the exact digit count to keep parsing unambiguous.
    const next = tokens[index + 1];
    const strictWidth = next !== undefined && next.type !== 'literal' && next.type !== 'a';

    switch (token.type) {
      case 'yyyy': {
        const v = readDigits(state, strictWidth ? 4 : 1, 4);
        if (v === null) return null;
        year = v;
        break;
      }
      case 'yy': {
        const v = readDigits(state, strictWidth ? 2 : 1, 2);
        if (v === null) return null;
        year = v < 50 ? 2000 + v : 1900 + v;
        break;
      }
      case 'MM':
      case 'M': {
        const v = readDigits(state, token.type === 'MM' && strictWidth ? 2 : 1, 2);
        if (v === null || v < 1 || v > 12) return null;
        month = v;
        break;
      }
      case 'dd':
      case 'd': {
        const v = readDigits(state, token.type === 'dd' && strictWidth ? 2 : 1, 2);
        if (v === null || v < 1 || v > 31) return null;
        day = v;
        break;
      }
      case 'HH':
      case 'H': {
        const v = readDigits(state, token.type === 'HH' && strictWidth ? 2 : 1, 2);
        if (v === null || v > 23) return null;
        hours = v;
        break;
      }
      case 'hh':
      case 'h': {
        const v = readDigits(state, token.type === 'hh' && strictWidth ? 2 : 1, 2);
        if (v === null || v < 1 || v > 12) return null;
        hour12 = v;
        break;
      }
      case 'mm':
      case 'm': {
        const v = readDigits(state, token.type === 'mm' && strictWidth ? 2 : 1, 2);
        if (v === null || v > 59) return null;
        minutes = v;
        break;
      }
      case 'ss':
      case 's': {
        const v = readDigits(state, token.type === 'ss' && strictWidth ? 2 : 1, 2);
        if (v === null || v > 59) return null;
        seconds = v;
        break;
      }
      case 'a': {
        const match = matchMeridiem(state.text, state.pos, meridiems);
        if (!match) {
          return null;
        }
        meridiem = match.meridiem;
        state.pos += match.length;
        break;
      }
      case 'literal': {
        const literal = token.literal ?? '';
        // Be lenient about whitespace amount but strict about other characters.
        for (const ch of literal) {
          if (ch === ' ') {
            while (state.text[state.pos] === ' ') {
              state.pos += 1;
            }
          } else if (state.text[state.pos] === ch) {
            state.pos += 1;
          } else {
            return null;
          }
        }
        break;
      }
      default:
        return null;
    }
  }

  if (state.pos !== state.text.length) {
    return null;
  }

  if (hour12 !== null) {
    // 12h clock: default to AM when the pattern has no meridiem token.
    const pm = meridiem === 'pm';
    hours = (hour12 % 12) + (pm ? 12 : 0);
  } else if (meridiem !== null) {
    // Meridiem with a 24h token: normalize (e.g. "13 PM" is invalid).
    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours >= 12) {
      return null;
    }
  }

  // Validate the calendar date (e.g. reject Feb 30).
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null;
  }

  return { year, month, day, hours, minutes, seconds };
}

/** Derives which UI parts (calendar, time columns, 12h mode) the pattern enables. */
export function deriveTimeConfig(tokens: Token[]): TimeConfig {
  const has = (...types: TokenType[]) => tokens.some((t) => types.includes(t.type));

  const hasDate = has('yyyy', 'yy', 'MM', 'M', 'dd', 'd');
  const use12h = has('hh', 'h');
  const showHours = use12h || has('HH', 'H');
  const showMinutes = has('mm', 'm');
  const showSeconds = has('ss', 's');
  const showMeridiem = use12h; // AM/PM column whenever the clock is 12h
  const hasTime = showHours || showMinutes || showSeconds;

  return { hasDate, hasTime, use12h, showHours, showMinutes, showSeconds, showMeridiem };
}

/**
 * Parses an ISO-8601 local date-time string (yyyy-MM-ddTHH:mm[:ss]) into
 * parts. Strings with anything extra — timezone designators (`Z`, offsets)
 * or sub-second precision — are rejected rather than silently reinterpreted
 * as local wall time.
 */
export function parseIsoDateTime(iso: string): DateTimeParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/u.exec(iso);
  if (!match) {
    return null;
  }
  const [, y, mo, d, h, mi, s] = match;
  const parts: DateTimeParts = {
    year: parseInt(y, 10),
    month: parseInt(mo, 10),
    day: parseInt(d, 10),
    hours: parseInt(h, 10),
    minutes: parseInt(mi, 10),
    seconds: s ? parseInt(s, 10) : 0,
  };
  if (parts.month < 1 || parts.month > 12 || parts.hours > 23 || parts.minutes > 59 || parts.seconds > 59) {
    return null;
  }
  const probe = new Date(parts.year, parts.month - 1, parts.day);
  if (probe.getDate() !== parts.day || probe.getMonth() !== parts.month - 1) {
    return null;
  }
  return parts;
}

/** Serializes parts to an ISO-8601 local date-time string (always with seconds). */
export function toIsoDateTime(parts: DateTimeParts): string {
  return `${pad(parts.year, 4)}-${pad(parts.month, 2)}-${pad(parts.day, 2)}T${pad(parts.hours, 2)}:${pad(
    parts.minutes,
    2,
  )}:${pad(parts.seconds, 2)}`;
}

/** Converts parts to a JS Date (local time). */
export function partsToDate(parts: DateTimeParts): Date {
  const date = new Date(0, 0);
  date.setFullYear(parts.year);
  date.setMonth(parts.month - 1, parts.day);
  date.setHours(parts.hours, parts.minutes, parts.seconds, 0);
  return date;
}

/** Converts a JS Date to parts. */
export function dateToParts(date: Date): DateTimeParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}
