/**
 * @license
 * Copyright (c) 2016 - 2026 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 *
 * Forked for DateTimeComboPicker from vaadin/web-components v25.2.7
 * (packages/date-picker/src/styles/vaadin-month-calendar-base-styles.js).
 * See NOTICE. The fork-specific layer at the end adds the stacking-context
 * fix for this add-on's overlay embedding and the selection-accent chain.
 */
import '@vaadin/component-base/src/styles/style-props.js';
import { css } from 'lit';

export const monthCalendarStyles = css`
  :host {
    display: block;
    padding: var(--vaadin-date-picker-month-padding, var(--vaadin-padding-s));
  }

  [part='month-header'] {
    color: var(--vaadin-date-picker-month-header-color, var(--vaadin-text-color));
    font-size: var(--vaadin-date-picker-month-header-font-size, 0.9375rem);
    font-weight: var(--vaadin-date-picker-month-header-font-weight, 500);
    line-height: 1;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  table {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  thead,
  tbody,
  tr {
    display: contents;
  }

  [part~='weekday'] {
    color: var(--vaadin-date-picker-weekday-color, var(--vaadin-text-color-secondary));
    font-size: var(--vaadin-date-picker-weekday-font-size, 0.75rem);
    font-weight: var(--vaadin-date-picker-weekday-font-weight, 500);
    margin-bottom: 0.375rem;
  }

  /* Week numbers are on a separate row, don't reserve space on weekday row. */
  [part~='weekday']:empty {
    display: none;
  }

  [part~='week-number'] {
    grid-column: -1 / 1;
    color: var(--vaadin-date-picker-week-number-color, var(--vaadin-text-color-secondary));
    font-size: var(--vaadin-date-picker-week-number-font-size, 0.7rem);
    line-height: 1;
    margin-top: 0.125em;
    margin-bottom: 0.125em;
    gap: 0.25em;
  }

  [part~='week-number']::after {
    content: '';
    height: 1px;
    flex: 1;
    background: var(
      --vaadin-date-picker-week-divider-color,
      var(--vaadin-divider-color, var(--vaadin-border-color-secondary))
    );
  }

  [part~='weekday'],
  [part~='week-number'],
  [part~='date'] {
    align-items: center;
    display: flex;
    justify-content: center;
    padding: 0;
  }

  [part~='date'] {
    border-radius: var(--vaadin-date-picker-date-border-radius, var(--vaadin-radius-m));
    position: relative;
    height: var(--vaadin-date-picker-date-height, 2rem);
    cursor: var(--vaadin-clickable-cursor);
    outline: none;
  }

  [part~='date']:empty {
    pointer-events: none !important;
  }

  [part~='date']::after {
    border-radius: inherit;
    content: '';
    position: absolute;
    z-index: -1;
    height: min(2em, 100%);
    aspect-ratio: 1;
  }

  :where([part~='date']:focus-visible)::after {
    outline: var(--vaadin-focus-ring-width) solid var(--vaadin-focus-ring-color);
    outline-offset: calc(var(--vaadin-focus-ring-width) * -1);
  }

  [part~='today'] {
    color: var(--vaadin-date-picker-date-today-color, var(--vaadin-text-color));
  }

  [part~='selected'] {
    color: var(--vaadin-date-picker-date-selected-color, var(--vaadin-background-color));
  }

  [part~='selected']::after {
    background: var(--vaadin-date-picker-date-selected-background, var(--vaadin-text-color));
    outline-offset: 1px;
  }

  [disabled] {
    cursor: var(--vaadin-disabled-cursor);
    color: var(--vaadin-date-picker-date-disabled-color, var(--vaadin-text-color-disabled));
    opacity: 0.7;
  }

  [hidden] {
    display: none;
  }

  @media (forced-colors: active) {
    [part~='week-number']::after {
      background: CanvasText;
    }

    [part~='today'] {
      font-weight: 600;
    }

    [part~='selected'] {
      forced-color-adjust: none;
      --vaadin-date-picker-date-selected-color: SelectedItemText;
      color: SelectedItemText !important;
      --vaadin-date-picker-date-selected-background: SelectedItem;
    }

    [disabled] {
      color: GrayText !important;
    }
  }

  /* --------------------------------------------------------------------
     Fork-specific layer (not in upstream). */

  :host {
    /* Selection accent: explicit --dtcp-* override, else the theme's
       date-picker accent tokens (Aura and custom themes), else the Lumo
       primary color, else the monochrome base. */
    --_accent-bg: var(
      --dtcp-selection-background,
      var(--vaadin-date-picker-date-selected-background, var(--lumo-primary-color, var(--vaadin-text-color)))
    );
    --_accent-fg: var(
      --dtcp-selection-color,
      var(--vaadin-date-picker-date-selected-color, var(--lumo-primary-contrast-color, var(--vaadin-background-color)))
    );
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  [part~='date'] {
    /* Keep the z-index:-1 backing shape (::after) inside the cell: without
       a local stacking context it paints behind the opaque overlay
       background (Vaadin 25 renders the overlay in the field's shadow root
       with no stacking context in between) */
    isolation: isolate;
  }

  [part~='today'] {
    color: var(--dtcp-selection-background, var(--vaadin-date-picker-date-today-color, var(--_accent-bg)));
    font-weight: 500;
  }

  [part~='selected'] {
    color: var(--_accent-fg);
  }

  [part~='selected']::after {
    background: var(--_accent-bg);
  }

  [part~='date']:not(:empty):not([disabled]):not([part~='selected']):hover::after {
    background-color: var(--vaadin-background-container);
  }

  @media (pointer: coarse) {
    [part~='date']:hover:not([part~='selected'])::after {
      background-color: transparent;
    }
  }

  /* Disabled host (whole calendar) */
  :host([disabled]) * {
    color: var(--vaadin-text-color-disabled) !important;
  }
`;
