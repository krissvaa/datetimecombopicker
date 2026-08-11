# DateTimeComboPicker — User Guide

A combined date & time picker: a single field with a `LocalDateTime` value and a
single popup containing a month calendar and a time selector. Available as a
[Vaadin Flow](#using-with-vaadin-flow) component (`org.vaadin.addons:datetimecombopicker`)
and as a standalone [web component](#using-the-web-component) (npm `date-time-combo-picker`).

- [Core concepts](#core-concepts)
- [Using with Vaadin Flow](#using-with-vaadin-flow)
- [Using the web component](#using-the-web-component)
- [Format pattern reference](#format-pattern-reference)
- [Options](#options)
- [Validation](#validation)
- [Internationalization](#internationalization)
- [Keyboard interaction](#keyboard-interaction)
- [Mobile behavior](#mobile-behavior)
- [Styling](#styling)
- [Architecture notes](#architecture-notes)
- [Development](#development)
- [Limitations](#limitations)

## Core concepts

**One value, one popup.** Unlike Vaadin's built-in `DateTimePicker` (two fields,
two overlays), this component is a single text field whose popup shows the
calendar and the time selector together. The value is a `LocalDateTime`
(element-side: an ISO-8601 local date-time string `yyyy-MM-ddTHH:mm:ss`, empty
string when unset). There is no timezone handling by design.

**The format pattern drives the UI.** The pattern controls how the value is
displayed and parsed in the field *and* which parts the popup offers:

| Pattern | Field shows | Popup shows |
| --- | --- | --- |
| `dd.MM.yyyy HH:mm` (default) | `30.07.2026 13:05` | calendar + hours + minutes |
| `dd.MM.yyyy HH:mm:ss` | `30.07.2026 13:05:42` | … + seconds |
| `M/d/yyyy h:mm a` | `7/30/2026 1:05 PM` | calendar + 12h hours + minutes + AM/PM |
| `dd.MM.yyyy HH` | `30.07.2026 13` | calendar + hours only |
| `dd.MM.yyyy` | `30.07.2026` | calendar only (closes on selection) |
| `HH:mm:ss` | `13:05:42` | time selector only |

**Commit semantics.** By default, selections in the popup are staged behind an
OK/Cancel action bar: picking a date keeps the current time, picking a time
keeps the current date, and only OK applies the staged value. When nothing is
selected yet, the missing parts default to the
[initial position](#initialposition--reference-date) (or today / 00:00). Typed
text commits on <kbd>Enter</kbd> or blur through the format parser. With
[`autoApply` enabled](#action-bar-autoapply), selections apply to the value
immediately and the action bar is hidden.

## Using with Vaadin Flow

Requires Vaadin 25.1+ and Java 21. (For Vaadin 24.x, use the 1.x add-on version from the `v24` branch.)

```xml
<dependency>
    <groupId>org.vaadin.addons</groupId>
    <artifactId>datetimecombopicker</artifactId>
    <version>2.0.0</version>
</dependency>
```

```java
DateTimeComboPicker picker = new DateTimeComboPicker("Meeting");
picker.setFormat("dd.MM.yyyy HH:mm:ss");
picker.setValue(LocalDateTime.now());
picker.addValueChangeListener(e -> System.out.println(e.getValue()));
```

The component implements `HasValue<…, LocalDateTime>`, so it works with
`Binder` out of the box, plus the standard field interfaces: `HasLabel`,
`HasHelper`, `HasPlaceholder`, `HasValidation`, `HasTooltip`, `HasSize`,
`HasStyle`, `HasTheme`, `Focusable`.

The add-on jar bundles the compiled web component under `META-INF/frontend`;
its bare imports (`lit`, `@vaadin/*`) resolve against the packages your Vaadin
platform already provides. No npm configuration is needed in the consuming
application.

## Using the web component

```sh
npm install date-time-combo-picker
```

```html
<script type="module">
  import 'date-time-combo-picker/dist/date-time-combo-picker-lumo.js';
</script>

<date-time-combo-picker
  label="Meeting"
  format="M/d/yyyy h:mm a"
  value="2026-07-30T13:30:00"
></date-time-combo-picker>
```

The component ships complete base styles and follows the application theme
via the `--vaadin-*` design tokens (see [Styling](#styling)); the `…-lumo.js`
entrypoint is a backwards-compatible alias for the element module. Events:
`value-changed`, `opened-changed`, `invalid-changed`, `change` (all
`detail.value`-style CustomEvents, matching Vaadin conventions).

## Format pattern reference

A subset of the `java.time`/`SimpleDateFormat` pattern letters:

| Letters | Meaning | Notes |
| --- | --- | --- |
| `yyyy` | 4-digit year | accepts 1–4 typed digits |
| `yy` | 2-digit year | windowed: `00`–`49` → 20xx, `50`–`99` → 19xx |
| `MM` / `M` | month, padded / plain | |
| `dd` / `d` | day of month | |
| `HH` / `H` | hour 0–23 | 24-hour clock |
| `hh` / `h` | hour 1–12 | 12-hour clock; enables the AM/PM selector |
| `mm` / `m` | minute | |
| `ss` / `s` | second | |
| `a` | AM/PM marker | localized via [i18n `am`/`pm`](#internationalization) |

Anything else is a literal. Quote literal text with single quotes (`'at'`,
`''` for a literal quote). Parsing is strict about literals (whitespace runs
are collapsed) and lenient about digit counts, except in separator-less
patterns like `HHmm` where exact widths are enforced.

## Options

Java method ↔ element property/attribute:

| Java | Element | Default | Description |
| --- | --- | --- | --- |
| `setValue(LocalDateTime)` | `value` | empty | The value; nanoseconds are truncated to seconds |
| `setFormat(String)` | `format` | `dd.MM.yyyy HH:mm` | See [format reference](#format-pattern-reference) |
| `setMin` / `setMax` | `min` / `max` | none | Allowed range, inclusive; see [Validation](#validation) |
| `setTimeView(TimeView)` | `time-view` | `columns` | `columns` or `clock` — see below |
| `setAutoAdvance(boolean)` | `auto-advance-disabled` (inverted) | advance | Clock only: advance hours → minutes → seconds after selecting |
| `setAutoAdvanceDelay(int)` | `auto-advance-delay` | 300 | Clock only: ms pause before auto-advancing (`0` = immediate) |
| `setMobileTabs(boolean)` | `mobile-tabs-disabled` (inverted) | tabs | Fullscreen only: Date/Time tabs with a formatted-value header — see [Mobile behavior](#mobile-behavior) |
| `setHourStep` / `setMinuteStep` / `setSecondStep` | `hour-step` / `minute-step` / `second-step` | 1 | Interval between selectable values; steps that divide 24/60 evenly produce uniform columns |
| `setDateDisabledFunction(String)` | `isDateDisabled` (function) | none | Disable individual dates — see below |
| `setInitialPosition(LocalDateTime)` | `initial-position` | none | See below |
| `setAutoApply(boolean)` | `auto-apply` | `false` | See [Action bar](#action-bar-autoapply) |
| `setCloseOnComplete(boolean)` | `close-on-complete` | `false` | With auto-apply: close once the date and every visible time part were picked |
| `setOkButtonVisible` / `setCancelButtonVisible` | `ok-button-hidden` / `cancel-button-hidden` (inverted) | visible | Hide a default action-bar button |
| `addToActionBar(Component...)` | `slot="action-bar"` | — | Custom content at the start of the action bar |
| `setAutoOpen(boolean)` | `auto-open-disabled` (inverted) | open | Whether clicking/typing in the field opens the popup |
| `setOpened(boolean)` | `opened` | `false` | Programmatic popup control |
| `setClearButtonVisible(boolean)` | `clear-button-visible` | `false` | Clear button in the field |
| `setShowWeekNumbers(boolean)` | `show-week-numbers` | `false` | ISO week numbers; requires `firstDayOfWeek` = 1 (Monday) |
| `setI18n(DateTimeComboPickerI18n)` | `i18n` | English | See [Internationalization](#internationalization) |

### Time views

- **`COLUMNS`** (default): one vertically scrollable column per time part in
  the style of a digital clock; click to select. Columns whose items all fit
  (AM/PM, heavily stepped columns) don't scroll.
- **`CLOCK`**: an analog dial in the Material Design (Android) style — tap or
  drag the hand; 24h mode uses a double ring (outer 1–12, inner 13–00). A
  digital readout above the dial switches between the hour/minute/second
  views; after a selection the next view opens automatically unless
  auto-advance is disabled (`setAutoAdvance(false)`). The 300 ms pause
  before advancing — there so the selection registers visually — can be
  tuned with `setAutoAdvanceDelay(int)`.

### Disabling dates

```java
picker.setDateDisabledFunction(
        "(d) => [0, 6].includes(new Date(d.year, d.month, d.day).getDay())");
```

The argument is a JavaScript function expression evaluated **in the browser**;
it receives `{ day, month, year }` where `month` is **0-based**, and returns
`true` to disable the date. Disabled dates cannot be clicked or selected with
the keyboard, and a value on a disabled date is invalid (client-side). Because
the function never runs on the server, always re-validate in your own logic
(e.g. a `Binder` validator) when disabled dates carry business meaning.

On the web component this is a plain function property:

```js
picker.isDateDisabled = ({ day, month, year }) => isHoliday(year, month + 1, day);
```

### `initialPosition` / reference date

When the field is empty, the popup opens at the current month and the first
selection defaults its missing parts to today / 00:00. `setInitialPosition`
replaces that reference: the popup opens at its month, and e.g. picking only
an hour completes the value with its date and minutes.

### Action bar (`autoApply`)

By default the popup stages selections: picking dates and times only updates
the popup preview; **OK** applies the staged value and closes, while
**Cancel**, <kbd>Escape</kbd> or clicking outside discards it. Button labels
come from i18n (`ok`, `cancel`). Typed text still commits directly on
<kbd>Enter</kbd>. `setAutoApply(true)` applies every selection immediately
and hides the action bar; since that leaves no OK button to end the flow,
`setCloseOnComplete(true)` makes the popup close on its own once the date
and every visible time part have been picked.

The action bar is customizable: `addToActionBar(new Button("Now", e -> ...))`
places components at its start, before the Cancel/OK buttons
(`removeFromActionBar` takes them out again), and the default buttons can be
hidden individually with `setOkButtonVisible(false)` /
`setCancelButtonVisible(false)`. In plain HTML, use
`<button slot="action-bar">` and the `ok-button-hidden` /
`cancel-button-hidden` attributes.

## Validation

Constraints: **bad input** (text that doesn't match the format), **required**,
**min**, **max**, and **date disabled**. Checking happens:

- **Client-side** on commit (Enter/blur) and when the popup closes — all
  constraints.
- **Server-side (Flow)** on every value change and when min/max change —
  min/max only. The server toggles the invalid state but never chooses the
  error message; it also triggers a client re-validation so client-only
  constraints keep their verdict. `Binder` disables the built-in server
  validation via the standard `setManualValidation(true)` mechanism.

Each constraint can have its own error message via i18n; unset messages fall
back to the generic `setErrorMessage(String)`:

```java
picker.setErrorMessage("Invalid value");
picker.setI18n(new DateTimeComboPickerI18n()
        .setBadInputErrorMessage("Doesn't match dd.MM.yyyy HH:mm")
        .setMinErrorMessage("Too early")
        .setMaxErrorMessage("Too late")
        .setRequiredErrorMessage("Required")
        .setDateDisabledErrorMessage("Date not available"));
```

Note: the i18n messages take precedence while their constraint is violated;
calling `setErrorMessage` during that time is not preserved.

## Internationalization

All texts live in one object — `DateTimeComboPickerI18n` (Java) / the `i18n`
property (element). Any property left unset keeps the English default.

| Key | Used for |
| --- | --- |
| `monthNames` (12) | calendar header, accessible day labels |
| `weekdays` (7, Sunday first) | accessible day labels |
| `weekdaysShort` (7, Sunday first) | calendar column headers |
| `firstDayOfWeek` (0 = Sunday … 6 = Saturday) | calendar layout |
| `today` | Today button |
| `year` | year-selector accessible label |
| `ok`, `cancel` | action bar buttons |
| `prevMonth`, `nextMonth` | month navigation button labels |
| `hours`, `minutes`, `seconds`, `meridiem` | time selector accessible labels |
| `am`, `pm` | AM/PM markers — in the popup **and** in the field text/parsing |
| `badInputErrorMessage`, `requiredErrorMessage`, `minErrorMessage`, `maxErrorMessage`, `dateDisabledErrorMessage` | per-constraint [error messages](#validation) |

When typing, AM/PM markers are matched case-insensitively; any unambiguous
prefix of a marker is accepted (with markers `ap.`/`ip.`, the inputs `a`,
`ap`, `i`, `ip` all resolve).

```java
picker.setFormat("d.M.yyyy h.mm a");
picker.setI18n(new DateTimeComboPickerI18n()
        .setMonthNames(List.of("tammikuu", /* … */ "joulukuu"))
        .setWeekdays(List.of("sunnuntai", /* … */ "lauantai"))
        .setWeekdaysShort(List.of("su", "ma", "ti", "ke", "to", "pe", "la"))
        .setFirstDayOfWeek(1)
        .setToday("Tänään").setYear("Vuosi").setCancel("Peruuta")
        .setAm("ap.").setPm("ip."));
```

## Keyboard interaction

In the field:

| Key | Action |
| --- | --- |
| <kbd>ArrowDown</kbd> / <kbd>ArrowUp</kbd> | open the popup |
| <kbd>ArrowDown</kbd> (popup open) | move focus into the calendar (or time columns for time-only patterns) |
| <kbd>Enter</kbd> | commit the typed text, close the popup |
| <kbd>Escape</kbd> | close the popup; when closed, clear the value (with the clear button visible) |

In the calendar:

| Key | Action |
| --- | --- |
| Arrow keys | move the focused date by day / week (direction-aware in RTL) |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | previous / next month |
| <kbd>Shift</kbd>+<kbd>PageUp</kbd> / <kbd>PageDown</kbd> | previous / next year |
| <kbd>Home</kbd> / <kbd>End</kbd> | first / last day of the month |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | select the focused date |
| <kbd>Escape</kbd> | close the popup, focus returns to the field |

In the year grid (opened from the month-year header): arrows move by one
year / one row, <kbd>Home</kbd>/<kbd>End</kbd> jump to the range bounds
(1900–2099), <kbd>Enter</kbd> selects.

The input carries combobox popup semantics (`role="combobox"`,
`aria-expanded`, `aria-haspopup="dialog"`) and the popup itself is a
`role="dialog"`. Tabbing out of the popup closes it and commits, like
leaving the field.

Time columns are listboxes (<kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd>/<kbd>Home</kbd>/<kbd>End</kbd>).
The analog clock face is a slider per view: arrows adjust by one step,
<kbd>Home</kbd>/<kbd>End</kbd> jump to the first/last value.

## Mobile behavior

On viewports at most 450px wide (or high), the popup becomes a fullscreen
bottom sheet with a backdrop. This is automatic (a media query), with no
configuration.

When the format has both a date and a time part, the sheet shows Date/Time
tabs with one section at a time — selecting a day moves on to the Time tab,
like the Material mobile picker — and the value is shown above the tabs in
the field's format while choosing (the format pattern itself while empty).
The tab labels localize via `i18n.setDateTab(...)` / `i18n.setTimeTab(...)`.
`setMobileTabs(false)` (`mobile-tabs-disabled`) switches to the stacked
layout instead: the calendar above a centered time selector.

## Styling

The component follows the Vaadin 25 styling model: it ships complete
**base styles** built on the `--vaadin-*` design tokens, so it renders a
usable monochrome look with no theme, and adopts the application theme's
tokens automatically (typography, colors, radii, focus ring).

The **selection accent** (selected date/time, OK button, active tab,
Today) follows the theme's date-picker accent so the popup matches the
app's date pickers out of the box:

1. `--dtcp-selection-background` / `--dtcp-selection-color` — explicit
   override, highest precedence;
2. `--vaadin-date-picker-date-selected-background` / `-color` — set by
   Aura and by custom themes;
3. `--lumo-primary-color` / `--lumo-primary-contrast-color` — set by the
   Lumo theme;
4. the monochrome base (`--vaadin-text-color` on
   `--vaadin-background-color`) otherwise.

```css
/* Give just this component a custom accent */
date-time-combo-picker, dtcp-overlay {
  --dtcp-selection-background: #7c3aed;
  --dtcp-selection-color: white;
}
```

Custom styling of individual elements uses shadow parts:

```css
date-time-combo-picker::part(toggle-button) { color: purple; }
```

| Element | Parts |
| --- | --- |
| `date-time-combo-picker` | standard field parts (`label`, `input-field`, `helper-text`, `error-message`, `required-indicator`, `clear-button`) + `toggle-button` |
| `dtcp-overlay` | `overlay`, `content`, `backdrop` |
| `dtcp-overlay-content` | `main`, `calendar-section`, `calendar-header`, `prev-month-button`, `next-month-button`, `month-year-label`, `year-grid`, `year-cell`, `year-cell-selected`, `calendar-footer`, `today-button`, `time-section`, `tabs-header`, `tabs`, `tab`, `date-tab`, `time-tab`, `tab-selected`, `action-bar`, `action-bar-spacer`, `ok-action-button`, `cancel-action-button` |
| `dtcp-month-calendar` | `month-header`, `weekdays`, `weekday`, `week-number`, `date` (+ state parts `today`, `selected`, `focused`, `disabled`, `past`, `future`) |
| `dtcp-time-columns` | `column`, `time-cell`, `time-cell-selected` |
| `dtcp-time-clock` | `clock-readout`, `readout-segment`, `readout-segment-active`, `readout-separator`, `meridiem-toggle`, `meridiem-button`, `meridiem-button-selected`, `clock-face`, `clock-number`, `clock-number-inner`, `clock-number-selected`, `clock-hand`, `clock-hand-label` |

The clock face size can be adjusted with `--_face-size` on `dtcp-time-clock`.

## Architecture notes

- **Mono-repo**: `web-component/` (npm, Lit 3 + TypeScript) and `flow/`
  (Maven). The Flow jar bundles the compiled ES modules under
  `META-INF/frontend/date-time-combo-picker/`; bare imports resolve against
  the consuming app's Vaadin platform packages, so the add-on works without
  the npm package being installed.
- **The month calendar is forked**, not imported, from `@vaadin/date-picker`
  (vaadin/web-components v25.2.7, Apache-2.0) — see `NOTICE` for provenance.
  This keeps the add-on immune to changes in Vaadin's private internals; the
  cost is manually syncing upstream fixes.
- The popup composes the public `@vaadin/overlay` mixins; the field chrome
  comes from `@vaadin/field-base` — the same building blocks Vaadin's own
  pickers use.
- Deliberate deviations from upstream in the forked calendar: `render()`
  falls back to empty arrays for not-yet-computed properties (upstream does
  not guard), date cells get `isolation: isolate` so their `z-index: -1`
  backing shape stays inside the cell when the overlay renders in the field's
  shadow root, and a small appended style layer routes the selected/today
  accent through `--dtcp-selection-background`/`--dtcp-selection-color`.

## Development

```sh
# Web component
cd web-component
npm install
npm run dev        # vite playground at http://localhost:5173
npm test           # web-test-runner (Chromium)
npm run build      # tsc -> dist/

# Flow add-on + demo
cd flow
mvn jetty:run      # demo at http://localhost:8080, with a Base/Lumo/Aura + dark theme switcher
mvn test

# End-to-end tests (starts the demo server itself)
cd it
npm install
npm test           # VAADIN_VERSION=25.1.11 npm test for another platform version

# Vaadin Directory package
cd flow
mvn install -Pdirectory    # -> target/datetimecombopicker-<version>.zip
```

Releases: `./release.sh <version>` sets both versions, runs all builds and
tests, publishes to npm and produces the Directory zip. CI (GitHub Actions)
runs the web-component tests, `mvn verify` against the minimum (25.1) and a
current Vaadin version, and the Playwright integration tests.

## Limitations

- No timezone support — the value is a `LocalDateTime` by design. Element
  `value` strings carrying timezone designators (`Z`, offsets) are rejected,
  not reinterpreted.
- Sub-second precision is not supported in patterns (no `SSS`); values are
  truncated to seconds on the server.
- The Flow `isInvalid()` reflects the server-known state (min/max and
  `setInvalid`); browser-only constraints (bad input, required, disabled
  dates) are not reported back to the server.
- The date-disabled function is browser-only; re-validate server-side where it
  matters.
- Week numbers require the week to start on Monday (inherited from
  `vaadin-date-picker`).
- Separator-less patterns (`HHmm`) enforce exact digit widths when typing.
- The popup is Lumo-themed; there is no Material theme variant.
