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
import '@vaadin/vaadin-lumo-styles/color.js';
import '@vaadin/vaadin-lumo-styles/sizing.js';
import '@vaadin/vaadin-lumo-styles/spacing.js';
import '@vaadin/vaadin-lumo-styles/style.js';
import '@vaadin/vaadin-lumo-styles/typography.js';
import '@vaadin/vaadin-lumo-styles/font-icons.js';
import '@vaadin/input-container/theme/lumo/vaadin-input-container-styles.js';
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
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
      }

      :host([top-aligned]) [part~='overlay'] {
        margin-top: var(--lumo-space-xs);
      }

      :host([bottom-aligned]) [part~='overlay'] {
        margin-bottom: var(--lumo-space-xs);
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
      /* Height of the popup: month grid rows + header + weekdays + footer */
      height: calc(var(--lumo-size-m) * 9.5);
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
    }

    [part$='month-button'] {
      width: var(--lumo-size-s);
      height: var(--lumo-size-s);
      font-family: 'lumo-icons';
      font-size: var(--lumo-icon-size-m);
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
      border-inline-start: 1px solid var(--lumo-contrast-10pct);
      padding: var(--lumo-space-s) var(--lumo-space-xs);
      box-sizing: border-box;
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
