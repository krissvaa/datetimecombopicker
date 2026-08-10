/**
 * @license
 * Copyright (c) 2016 - 2025 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 *
 * Forked for DateTimeComboPicker from vaadin/web-components v24.8.14
 * (packages/date-picker/src/vaadin-month-calendar-styles.js). See NOTICE.
 * The visual layer at the end (Vaadin 25 base-styles model) is adapted
 * from the former Lumo theme module of this fork.
 */
import '@vaadin/component-base/src/styles/style-props.js';
import { css } from 'lit';

export const monthCalendarStyles = css`
  :host {
    display: block;
  }

  #monthGrid {
    width: 100%;
    border-collapse: collapse;
  }

  #days-container tr,
  #weekdays-container tr {
    display: flex;
  }

  [part~='date'] {
    outline: none;
  }

  [part~='disabled'] {
    pointer-events: none;
  }

  [part='week-number'][hidden],
  [part='weekday'][hidden] {
    display: none;
  }

  [part='weekday'],
  [part~='date'] {
    width: calc(100% / 7);
    padding: 0;
    font-weight: normal;
  }

  [part='weekday']:empty,
  [part='week-number'] {
    width: 12.5%;
    flex-shrink: 0;
    padding: 0;
  }

  :host([week-numbers]) [part='weekday']:not(:empty),
  :host([week-numbers]) [part~='date'] {
    width: 12.5%;
  }

  @media (forced-colors: active) {
    [part~='date'][part~='focused'] {
      outline: 1px solid;
    }

    [part~='date'][part~='selected'] {
      outline: 3px solid;
    }
  }

  /* --------------------------------------------------------------------
     Visual layer (Vaadin 25 base-styles model). The selection accent
     follows the app theme's date-picker accent; override with
     --dtcp-selection-background / --dtcp-selection-color. */
  :host {
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    font-size: 1rem;
    color: var(--vaadin-text-color);
    text-align: center;
    padding: 0 0.25rem;
    --_focus-ring-color: var(--vaadin-focus-ring-color, var(--vaadin-text-color));
    --_focus-ring-width: var(--vaadin-focus-ring-width, 2px);
    --_accent-bg: var(
      --dtcp-selection-background,
      var(--vaadin-date-picker-date-selected-background, var(--lumo-primary-color, var(--vaadin-text-color)))
    );
    --_accent-fg: var(
      --dtcp-selection-color,
      var(--vaadin-date-picker-date-selected-color, var(--lumo-primary-contrast-color, var(--vaadin-background-color)))
    );
  }

  /* Month header (visually hidden by the overlay content, kept for a11y) */

  [part='month-header'] {
    color: var(--vaadin-text-color);
    font-size: 1.125rem;
    line-height: 1;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  /* Week days and numbers */

  [part='weekdays'],
  [part='weekday'],
  [part='week-number'] {
    font-size: 0.6875rem;
    line-height: 1;
    color: var(--vaadin-text-color-secondary);
  }

  [part='weekdays'] {
    margin-bottom: 0.5rem;
  }

  [part='weekday']:empty,
  [part='week-number'] {
    width: 1.625rem;
  }

  /* Date and week number cells */

  [part~='date'],
  [part='week-number'] {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2.25rem;
    position: relative;
  }

  [part~='date'] {
    transition: color 0.1s;
    /* Keep the z-index:-1 highlight circle (::before) inside the cell:
       without a local stacking context it paints behind the opaque
       overlay background (Vaadin 25 renders the overlay in the field's
       shadow root with no stacking context in between) */
    isolation: isolate;
  }

  [part~='date']:not(:empty) {
    cursor: var(--vaadin-clickable-cursor);
  }

  :host([week-numbers]) [part='weekday']:not(:empty),
  :host([week-numbers]) [part~='date'] {
    width: calc((100% - 1.625rem) / 7);
  }

  /* Today date */

  [part~='date'][part~='today'] {
    color: var(--_accent-bg);
    font-weight: 500;
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
    border-radius: var(--vaadin-radius-m);
  }

  [part~='date'][part~='focused']::before {
    box-shadow:
      0 0 0 1px var(--vaadin-background-color),
      0 0 0 calc(var(--_focus-ring-width) + 1px) var(--_focus-ring-color);
  }

  :host(:not([focused])) [part~='date'][part~='focused']::before {
    animation: dtcp-month-calendar-focus-date 1.4s infinite;
  }

  @keyframes dtcp-month-calendar-focus-date {
    50% {
      box-shadow:
        0 0 0 1px var(--vaadin-background-color),
        0 0 0 calc(var(--_focus-ring-width) + 1px) transparent;
    }
  }

  [part~='date']:not(:empty):not([part~='disabled']):not([part~='selected']):hover::before {
    background-color: var(--vaadin-background-container);
  }

  [part~='date'][part~='selected'] {
    color: var(--_accent-fg);
  }

  [part~='date'][part~='selected']::before {
    background-color: var(--_accent-bg);
  }

  [part~='date'][part~='disabled'] {
    color: var(--vaadin-text-color-disabled);
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
    color: var(--vaadin-text-color-disabled) !important;
  }
`;
