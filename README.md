# DateTimeComboPicker

A combined **date & time picker**: a single field with a `LocalDateTime` value and a
**single popup** containing a month calendar and sliding time columns side by side.

The **date-time format pattern drives the UI**: the pattern defines how the value is
displayed and parsed in the field, *and* which time parts are offered in the popup —
no `ss` in the pattern → no seconds column, no `mm` → no minutes column,
`h`/`hh` → 12-hour clock with an AM/PM column.

| Default (24h) | 12h with AM/PM |
| --- | --- |
| ![Default popup](docs/img/popup-default.png) | ![12h popup](docs/img/popup-12h.png) |

This is a mono-repo with two packages:

| Package | Artifact | For |
| --- | --- | --- |
| [`web-component/`](web-component) | npm `date-time-combo-picker` | Any web app (Lit-based web component) |
| [`flow/`](flow) | Maven `org.vaadin.addons:datetimecombopicker` | Vaadin Flow 24.4+ (Java 17) |

## Vaadin Flow usage

```xml
<dependency>
    <groupId>org.vaadin.addons</groupId>
    <artifactId>datetimecombopicker</artifactId>
    <version>1.0.0</version>
</dependency>
```

```java
DateTimeComboPicker picker = new DateTimeComboPicker("Meeting");
picker.setFormat("dd.MM.yyyy HH:mm:ss");   // seconds column appears automatically
picker.setValue(LocalDateTime.now());
picker.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
picker.setClearButtonVisible(true);
picker.addValueChangeListener(e -> System.out.println(e.getValue()));
```

Works with `Binder` out of the box (`HasValue<..., LocalDateTime>`), supports label,
helper, placeholder, tooltip, error message / invalid state, required indicator,
min/max, auto-open, week numbers and i18n:

```java
picker.setI18n(new DateTimeComboPickerI18n()
        .setMonthNames(List.of("tammikuu", "helmikuu", /* ... */ "joulukuu"))
        .setFirstDayOfWeek(1)
        .setToday("Tänään"));
```

## Web component usage

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

The `value` property/attribute is an ISO-8601 local date-time string
(`yyyy-MM-ddTHH:mm:ss`), empty string when unset. Events: `value-changed`,
`opened-changed`, `invalid-changed`, `change`.

## Format pattern

Supported pattern letters (a subset of `java.time` / `SimpleDateFormat`):

| Letters | Meaning | Effect on popup |
| --- | --- | --- |
| `yyyy` / `yy` | year (4-digit / 2-digit, windowed 1950–2049) | calendar shown |
| `MM` / `M` | month | calendar shown |
| `dd` / `d` | day of month | calendar shown |
| `HH` / `H` | hour 0–23 | 24h hours column |
| `hh` / `h` | hour 1–12 | 12h hours column + AM/PM column |
| `mm` / `m` | minute | minutes column |
| `ss` / `s` | second | seconds column |
| `a` | AM/PM marker | — |

Anything else is a literal; quote literal text with single quotes (`'at'`).
A pattern with only date letters behaves like a date picker (popup closes on
selection); a pattern with only time letters shows only the time columns.

Examples: `dd.MM.yyyy HH:mm` (default), `dd.MM.yyyy HH:mm:ss`, `M/d/yyyy h:mm a`,
`dd.MM.yyyy HH`, `yyyy-MM-dd`, `HH:mm:ss`.

## Development

```sh
# Web component: dev playground, tests, build
cd web-component
npm install
npm run dev        # vite playground at http://localhost:5173
npm test           # web-test-runner (real Chromium)
npm run build      # tsc -> dist/

# Flow add-on: demo app + tests
cd flow
mvn jetty:run      # demo at http://localhost:8080 (builds the npm package first)
mvn test
mvn install -Pdirectory   # build the Vaadin Directory zip (target/*.zip)
```

The Flow jar bundles the compiled web component under `META-INF/frontend`, so the
add-on has no npm-publication dependency; bare imports (`lit`, `@vaadin/*`) resolve
against the consuming application's Vaadin 24 platform packages.

## Architecture notes

- The month calendar is **forked from `@vaadin/date-picker`**
  ([vaadin/web-components](https://github.com/vaadin/web-components) v24.8.14,
  Apache-2.0) rather than imported from its private internals, so Vaadin minor
  updates cannot break it. See [`NOTICE`](NOTICE) for provenance and the list of
  forked files.
- The popup is composed from the public `@vaadin/overlay` mixins, the field chrome
  from `@vaadin/field-base` — the same recipe Vaadin's own pickers use, so the
  component inherits Lumo theming and form-field behavior.
- The time selector is a set of free-scrolling columns with click-to-select and
  keyboard support (`ArrowUp`/`ArrowDown`/`Home`/`End`), modeled on the MUI X
  digital clock.

## Inspirations & credits

This project stands on the shoulders of:

- [vcf-date-time-range-picker](https://github.com/vaadin-component-factory/vcf-date-time-range-picker)
  (Vaadin Component Factory) — proved the "fork the date-picker and graft a time UI
  into the same popup" approach.
- [Vaadin DateTimePicker](https://vaadin.com/docs/latest/components/date-time-picker)
  — the API model (`LocalDateTime` value, ISO string element property, min/max,
  i18n object). DateTimeComboPicker exists because DateTimePicker uses two separate
  fields and overlays where one combined popup was wanted.
- [MUI X DateTimePicker](https://mui.com/x/react-date-pickers/date-time-picker/)
  — the popup layout: calendar on the left, sliding hour/minute/second columns on
  the right.
- [MiniCalendar add-on](https://vaadin.com/directory/component/minicalendar-add-on-for-vaadin)
  — evaluated as the calendar building block; not used because it is a server-side
  Java component and this add-on needed a client-side calendar inside a single
  web-component popup.
- [@vaadin/date-picker](https://github.com/vaadin/web-components/tree/main/packages/date-picker)
  (Apache-2.0) — the forked month-calendar implementation and the Lumo theme CSS it
  ships with; also the reference for field/overlay composition.
- [addon-starter-flow](https://github.com/vaadin/addon-starter-flow) — Maven
  conventions for Vaadin Directory add-ons (test-scope demo, directory assembly).

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
