/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Lumo theme for <date-time-combo-picker> and its internal elements.
 * The month-calendar CSS is adapted from vaadin/web-components v24.8.14
 * (packages/date-picker/theme/lumo/, Apache-2.0). See NOTICE.
 *
 * Import this module BEFORE the element modules so that the styles are
 * registered when the custom elements are finalized.
 */
// Vaadin 25: the global Lumo tokens (custom properties, icon font) are
// plain CSS provided by the application theme; the V24-era JS modules
// (color.js, sizing.js, ...) no longer exist.
import { inputFieldShared } from '@vaadin/vaadin-lumo-styles/mixins/input-field-shared.js';
import { menuOverlay } from '@vaadin/vaadin-lumo-styles/mixins/menu-overlay.js';
import { css, registerStyles } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';

/* ---------------------------------------------------------------- field */

registerStyles(
  'date-time-combo-picker',
  [
    inputFieldShared,
    css`
      [part='toggle-button']::before {
        content: var(--lumo-icons-calendar);
      }

      [part='clear-button']::before {
        content: var(--lumo-icons-cross);
      }
    `,
  ],
  { moduleId: 'lumo-date-time-combo-picker' },
);

/* -------------------------------------------------------------- overlay */

registerStyles(
  'dtcp-overlay',
  [
    menuOverlay,
    css`
      [part='overlay'] {
        /* Size the popup by its content instead of stretching to the viewport;
           scroll when the viewport clamps it (field mid-screen in a short window) */
        flex: none;
        height: auto;
        max-height: 100%;
        overflow: auto;
        -webkit-tap-highlight-color: transparent;
      }

      :host([top-aligned]) [part~='overlay'] {
        margin-top: var(--lumo-space-xs);
      }

      :host([bottom-aligned]) [part~='overlay'] {
        margin-bottom: var(--lumo-space-xs);
      }

      /* Fullscreen (mobile): bottom sheet with a backdrop */
      :host([fullscreen]) {
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-end;
        padding: 0;
      }

      :host([fullscreen]) [part='overlay'] {
        width: 100%;
        max-height: 80vh;
        margin: 0;
        border-radius: var(--lumo-border-radius-l) var(--lumo-border-radius-l) 0 0;
      }

      /* Scroll inside the sheet when the content is taller than the 80vh cap
         (e.g. the analog clock on a short viewport). No menu-overlay padding
         or edge-fade mask: the sheet sections bring their own spacing, and
         the mask would wash out the header/action bar at the edges. */
      :host([fullscreen]) [part='content'] {
        overflow-y: auto;
        padding: 0;
        -webkit-mask-image: none;
        mask-image: none;
      }
    `,
  ],
  { moduleId: 'lumo-dtcp-overlay' },
);

/* ------------------------------------------------------ overlay content */

registerStyles(
  'dtcp-overlay-content',
  css`
    :host {
      font-family: var(--lumo-font-family);
      font-size: var(--lumo-font-size-m);
      color: var(--lumo-body-text-color);
    }

    [part='main'] {
      /* Height of the popup: month grid rows + header + weekdays + footer */
      height: calc(var(--lumo-size-m) * 9.5);
      flex: none;
    }

    [part='action-bar'] {
      border-top: 1px solid var(--lumo-contrast-10pct);
      padding: var(--lumo-space-s) var(--lumo-space-m);
      gap: var(--lumo-space-s);
    }

    [part$='-action-button'] {
      height: var(--lumo-size-s);
      padding: 0 var(--lumo-space-m);
      font-family: var(--lumo-font-family);
      font-size: var(--lumo-font-size-s);
      font-weight: 500;
      border-radius: var(--lumo-border-radius-m);
      cursor: var(--lumo-clickable-cursor);
    }

    [part='cancel-action-button'] {
      color: var(--lumo-secondary-text-color);
    }

    [part='cancel-action-button']:hover {
      background-color: var(--lumo-contrast-5pct);
    }

    [part='ok-action-button'] {
      color: var(--lumo-primary-contrast-color);
      background-color: var(--lumo-primary-color);
    }

    [part='ok-action-button']:hover {
      filter: brightness(1.1);
    }

    /* Fullscreen (mobile): calendar stacked above centered time columns */
    :host([fullscreen]) [part='main'] {
      height: auto;
      width: 100%;
    }

    :host([fullscreen]) [part='calendar-section'] {
      margin-inline: auto;
      /* Fixed height (like the desktop popup) so 5- and 6-row months don't
         resize the sheet, keeping the prev/next buttons in place. The extra
         bottom padding keeps the Today button off the sheet/action-bar edge. */
      height: calc(var(--lumo-size-m) * 9.5 + 12px);
      padding-bottom: 20px;
    }

    :host([fullscreen]) [part='time-section'] {
      height: calc(var(--lumo-size-s) * 5);
    }

    /* Calendar/time separator; none needed for time-only formats */
    :host([fullscreen]) [part='calendar-section']:not([hidden]) + [part='time-section'] {
      border-top: 1px solid var(--lumo-contrast-10pct);
    }

    /* The clock sizes itself; the fixed height above is for the columns */
    :host([fullscreen]) [part='time-section']:has(dtcp-time-clock) {
      height: auto;
    }

    /* Tabbed fullscreen layout: formatted-value header, Date/Time tabs,
       one section at a time inside a fixed-height main */
    [part='tabs-header'] {
      /* 16px padding + the font's ~4px leading = ~20px visual gap */
      padding: var(--lumo-space-m) var(--lumo-space-m);
      font-size: var(--lumo-font-size-xl);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--lumo-header-text-color);
    }

    [part~='tab'] {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--lumo-space-xs);
      height: var(--lumo-size-m);
      font-size: var(--lumo-font-size-s);
      font-weight: 500;
      color: var(--lumo-secondary-text-color);
      cursor: var(--lumo-clickable-cursor);
      border-bottom: 2px solid var(--lumo-contrast-10pct);
    }

    [part~='tab']::before {
      font-family: 'lumo-icons';
      font-size: var(--lumo-icon-size-m);
      line-height: 1;
    }

    [part~='date-tab']::before {
      content: var(--lumo-icons-calendar);
    }

    [part~='time-tab']::before {
      content: var(--lumo-icons-clock);
    }

    [part~='tab-selected'] {
      color: var(--lumo-primary-text-color);
      border-bottom-color: var(--vaadin-selection-color, var(--lumo-primary-color));
    }

    :host([fullscreen][tabs]) [part='main'] {
      /* Both tab panels use the calendar's fixed height so switching
         tabs does not resize the sheet */
      height: calc(var(--lumo-size-m) * 9.5 + 12px);
    }

    :host([fullscreen][tabs]) [part='time-section'] {
      height: 100%;
      align-items: center;
    }

    [part='calendar-section'] {
      width: calc(var(--lumo-size-m) * 7 + var(--lumo-space-xs) * 2 + var(--lumo-space-m) * 2);
      padding: var(--lumo-space-s) var(--lumo-space-m);
      box-sizing: border-box;
    }

    [part='calendar-header'] {
      padding: var(--lumo-space-xs) 0 var(--lumo-space-s);
    }

    [part='month-year-label'] {
      color: var(--lumo-header-text-color);
      font-size: var(--lumo-font-size-l);
      font-weight: 500;
      line-height: 1;
      height: var(--lumo-size-s);
      border-radius: var(--lumo-border-radius-m);
      cursor: var(--lumo-clickable-cursor);
    }

    [part='month-year-label']:hover {
      background-color: var(--lumo-contrast-5pct);
    }

    [part='month-year-label']::after {
      content: var(--lumo-icons-dropdown);
      font-family: 'lumo-icons';
      font-size: var(--lumo-icon-size-s);
      color: var(--lumo-tertiary-text-color);
      vertical-align: middle;
      margin-inline-start: var(--lumo-space-xs);
      display: inline-block;
      transition: transform 0.1s;
    }

    [part='month-year-label'][aria-expanded='true']::after {
      transform: rotate(180deg);
    }

    [part='year-grid'] {
      gap: var(--lumo-space-xs);
      padding: var(--lumo-space-s) var(--lumo-space-xs);
      scrollbar-width: none;
    }

    [part='year-grid']::-webkit-scrollbar {
      display: none;
    }

    [part~='year-cell'] {
      height: var(--lumo-size-m);
      font-size: var(--lumo-font-size-m);
      border-radius: var(--lumo-border-radius-m);
      cursor: var(--lumo-clickable-cursor);
      font-variant-numeric: tabular-nums;
    }

    [part~='year-cell']:hover {
      background-color: var(--lumo-primary-color-10pct);
    }

    [part~='year-cell-selected'] {
      background-color: var(--vaadin-selection-color, var(--lumo-primary-color));
      color: var(--lumo-primary-contrast-color);
    }

    [part~='year-cell-selected']:hover {
      background-color: var(--vaadin-selection-color, var(--lumo-primary-color));
    }

    [part$='month-button'] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--lumo-size-s);
      height: var(--lumo-size-s);
      font-family: 'lumo-icons';
      font-size: var(--lumo-icon-size-m);
      line-height: 1;
      color: var(--lumo-tertiary-text-color);
      border-radius: var(--lumo-border-radius-m);
      cursor: var(--lumo-clickable-cursor);
    }

    [part$='month-button']:hover {
      color: var(--lumo-body-text-color);
      background-color: var(--lumo-contrast-5pct);
    }

    [part='prev-month-button']::before {
      content: var(--lumo-icons-angle-left);
    }

    [part='next-month-button']::before {
      content: var(--lumo-icons-angle-right);
    }

    :host([dir='rtl']) [part='prev-month-button']::before {
      content: var(--lumo-icons-angle-right);
    }

    :host([dir='rtl']) [part='next-month-button']::before {
      content: var(--lumo-icons-angle-left);
    }

    [part='calendar-footer'] {
      display: flex;
      justify-content: center;
      padding-top: var(--lumo-space-xs);
    }

    [part='today-button'] {
      appearance: none;
      border: 0;
      background: transparent;
      padding: 0 var(--lumo-space-m);
      height: var(--lumo-size-s);
      font-family: var(--lumo-font-family);
      font-size: var(--lumo-font-size-s);
      font-weight: 500;
      color: var(--lumo-primary-text-color);
      border-radius: var(--lumo-border-radius-m);
      cursor: var(--lumo-clickable-cursor);
    }

    [part='today-button']:hover {
      background-color: var(--lumo-primary-color-10pct);
    }

    [part='time-section'] {
      padding: var(--lumo-space-s) var(--lumo-space-xs);
      box-sizing: border-box;
    }

    /* Calendar/time separator; none needed for time-only formats */
    :host(:not([fullscreen])) [part='calendar-section']:not([hidden]) + [part='time-section'] {
      border-inline-start: 1px solid var(--lumo-contrast-10pct);
    }
  `,
  { moduleId: 'lumo-dtcp-overlay-content' },
);

/* --------------------------------------------------------- time columns */

registerStyles(
  'dtcp-time-columns',
  css`
    :host {
      font-family: var(--lumo-font-family);
      font-size: var(--lumo-font-size-s);
      color: var(--lumo-body-text-color);
    }

    [part='column'] {
      --_dtcp-cell-height: var(--lumo-size-s);
      width: var(--lumo-size-l);
      padding: 0 calc(var(--lumo-space-xs) / 2);
    }

    [part='column'] + [part='column'] {
      border-inline-start: 1px solid var(--lumo-contrast-10pct);
    }

    [part~='time-cell'] {
      display: flex;
      align-items: center;
      justify-content: center;
      height: var(--_dtcp-cell-height);
      border-radius: var(--lumo-border-radius-m);
      cursor: var(--lumo-clickable-cursor);
      font-variant-numeric: tabular-nums;
    }

    [part~='time-cell']:hover {
      background-color: var(--lumo-primary-color-10pct);
    }

    [part~='time-cell-selected'] {
      background-color: var(--vaadin-selection-color, var(--lumo-primary-color));
      color: var(--lumo-primary-contrast-color);
    }

    [part~='time-cell-selected']:hover {
      background-color: var(--vaadin-selection-color, var(--lumo-primary-color));
    }

    [part='column']:focus-visible {
      border-radius: var(--lumo-border-radius-m);
      box-shadow: 0 0 0 2px var(--lumo-primary-color-50pct);
    }
  `,
  { moduleId: 'lumo-dtcp-time-columns' },
);

/* ----------------------------------------------------------- time clock */

registerStyles(
  'dtcp-time-clock',
  css`
    :host {
      font-family: var(--lumo-font-family);
      color: var(--lumo-body-text-color);
      padding: var(--lumo-space-s);
      gap: var(--lumo-space-s);
      --_face-size: calc(var(--lumo-size-m) * 6.5);
    }

    [part='clock-readout'] {
      font-size: var(--lumo-font-size-xl);
      font-variant-numeric: tabular-nums;
      gap: var(--lumo-space-xs);
    }

    [part~='readout-segment'] {
      padding: 0 var(--lumo-space-xs);
      border-radius: var(--lumo-border-radius-m);
      color: var(--lumo-secondary-text-color);
      cursor: var(--lumo-clickable-cursor);
    }

    [part~='readout-segment']:hover {
      background-color: var(--lumo-contrast-5pct);
    }

    [part~='readout-segment-active'] {
      color: var(--lumo-primary-text-color);
      background-color: var(--lumo-primary-color-10pct);
    }

    [part='readout-separator'] {
      color: var(--lumo-tertiary-text-color);
    }

    [part='meridiem-toggle'] {
      display: inline-flex;
      flex-direction: column;
      margin-inline-start: var(--lumo-space-s);
      gap: 2px;
    }

    [part~='meridiem-button'] {
      font-size: var(--lumo-font-size-xs);
      font-weight: 500;
      line-height: 1;
      padding: var(--lumo-space-xs);
      border-radius: var(--lumo-border-radius-s);
      color: var(--lumo-secondary-text-color);
      cursor: var(--lumo-clickable-cursor);
    }

    [part~='meridiem-button']:hover {
      background-color: var(--lumo-contrast-5pct);
    }

    [part~='meridiem-button-selected'] {
      color: var(--lumo-primary-contrast-color);
      background-color: var(--vaadin-selection-color, var(--lumo-primary-color));
    }

    [part='clock-face'] {
      background-color: var(--lumo-contrast-5pct);
      cursor: var(--lumo-clickable-cursor);
    }

    [part='clock-face']:focus-visible {
      box-shadow: 0 0 0 2px var(--lumo-primary-color-50pct);
    }

    [part~='clock-number'] {
      width: var(--lumo-size-s);
      height: var(--lumo-size-s);
      border-radius: 50%;
      font-size: var(--lumo-font-size-s);
      font-variant-numeric: tabular-nums;
    }

    [part~='clock-number-inner'] {
      font-size: var(--lumo-font-size-xs);
      color: var(--lumo-secondary-text-color);
    }

    [part~='clock-number-selected'],
    [part~='clock-number-inner'][part~='clock-number-selected'] {
      color: var(--lumo-primary-contrast-color);
    }

    [part='clock-hand'] {
      background: var(--vaadin-selection-color, var(--lumo-primary-color));
    }

    [part='clock-hand']::before {
      width: var(--lumo-size-s);
      height: var(--lumo-size-s);
      background-color: var(--vaadin-selection-color, var(--lumo-primary-color));
    }

    [part='clock-hand-label'] {
      width: var(--lumo-size-s);
      height: var(--lumo-size-s);
      font-size: var(--lumo-font-size-s);
      font-variant-numeric: tabular-nums;
      color: var(--lumo-primary-contrast-color);
    }
  `,
  { moduleId: 'lumo-dtcp-time-clock' },
);

/* -------------------------------------------------------- month calendar
 * Adapted from packages/date-picker/theme/lumo/vaadin-month-calendar-styles.js
 * (vaadin/web-components v24.8.14, Apache-2.0).
 */

registerStyles(
  'dtcp-month-calendar',
  css`
    :host {
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      font-size: var(--lumo-font-size-m);
      color: var(--lumo-body-text-color);
      text-align: center;
      padding: 0 var(--lumo-space-xs);
      --_focus-ring-color: var(--vaadin-focus-ring-color, var(--lumo-primary-color-50pct));
      --_focus-ring-width: var(--vaadin-focus-ring-width, 2px);
      --_selection-color: var(--vaadin-selection-color, var(--lumo-primary-color));
      --_selection-color-text: var(--vaadin-selection-color-text, var(--lumo-primary-text-color));
    }

    /* Month header (visually hidden by the overlay content, kept for a11y) */

    [part='month-header'] {
      color: var(--lumo-header-text-color);
      font-size: var(--lumo-font-size-l);
      line-height: 1;
      font-weight: 500;
      margin-bottom: var(--lumo-space-m);
    }

    /* Week days and numbers */

    [part='weekdays'],
    [part='weekday'],
    [part='week-number'] {
      font-size: var(--lumo-font-size-xxs);
      line-height: 1;
      color: var(--lumo-secondary-text-color);
    }

    [part='weekdays'] {
      margin-bottom: var(--lumo-space-s);
    }

    [part='weekday']:empty,
    [part='week-number'] {
      width: var(--lumo-size-xs);
    }

    /* Date and week number cells */

    [part~='date'],
    [part='week-number'] {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--lumo-size-m);
      position: relative;
    }

    [part~='date'] {
      transition: color 0.1s;
    }

    [part~='date']:not(:empty) {
      cursor: var(--lumo-clickable-cursor);
    }

    :host([week-numbers]) [part='weekday']:not(:empty),
    :host([week-numbers]) [part~='date'] {
      width: calc((100% - var(--lumo-size-xs)) / 7);
    }

    /* Today date */

    [part~='date'][part~='today'] {
      color: var(--_selection-color-text);
    }

    /* Focused date */

    [part~='date']::before {
      content: '';
      position: absolute;
      z-index: -1;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      min-width: 2em;
      min-height: 2em;
      width: 80%;
      height: 80%;
      max-height: 100%;
      max-width: 100%;
      border-radius: var(--lumo-border-radius-m);
    }

    [part~='date'][part~='focused']::before {
      box-shadow:
        0 0 0 1px var(--lumo-base-color),
        0 0 0 calc(var(--_focus-ring-width) + 1px) var(--_focus-ring-color);
    }

    :host(:not([focused])) [part~='date'][part~='focused']::before {
      animation: dtcp-month-calendar-focus-date 1.4s infinite;
    }

    @keyframes dtcp-month-calendar-focus-date {
      50% {
        box-shadow:
          0 0 0 1px var(--lumo-base-color),
          0 0 0 calc(var(--_focus-ring-width) + 1px) transparent;
      }
    }

    [part~='date']:not(:empty):not([part~='disabled']):not([part~='selected']):hover::before {
      background-color: var(--lumo-primary-color-10pct);
    }

    [part~='date'][part~='selected'] {
      color: var(--lumo-primary-contrast-color);
    }

    [part~='date'][part~='selected']::before {
      background-color: var(--_selection-color);
    }

    [part~='date'][part~='disabled'] {
      color: var(--lumo-disabled-text-color);
    }

    @media (pointer: coarse) {
      [part~='date']:hover:not([part~='selected'])::before,
      :host(:not([focus-ring])) [part~='focused']:not([part~='selected'])::before {
        display: none;
      }

      [part~='date']:not(:empty):not([part~='disabled']):active::before {
        display: block;
      }

      :host(:not([focus-ring])) [part~='date'][part~='selected']::before {
        box-shadow: none;
      }
    }

    /* Disabled */

    :host([disabled]) * {
      color: var(--lumo-disabled-text-color) !important;
    }
  `,
  { moduleId: 'lumo-dtcp-month-calendar' },
);
