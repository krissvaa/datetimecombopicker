/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * The sliding time columns are inspired by the MUI X DateTimePicker
 * (https://mui.com/x/react-date-pickers/date-time-picker/).
 */
import { css, html, LitElement, nothing } from 'lit';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import type { TimeConfig } from './dtcp-format.js';

export interface TimeValue {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface TimeColumnsI18n {
  hours: string;
  minutes: string;
  seconds: string;
  meridiem: string;
  am: string;
  pm: string;
}

type ColumnKind = 'hours' | 'minutes' | 'seconds' | 'meridiem';

interface ColumnItem {
  value: number | string;
  label: string;
}

const DEFAULT_CONFIG: TimeConfig = {
  hasDate: true,
  hasTime: true,
  use12h: false,
  showHours: true,
  showMinutes: true,
  showSeconds: false,
  showMeridiem: false,
};

/**
 * `<dtcp-time-columns>` renders up to four vertically scrollable columns
 * (hours, minutes, seconds, AM/PM) in the style of the MUI digital clock.
 * Clicking (or keyboard-navigating to) an item selects it.
 *
 * @fires time-changed - Fired when the user selects a time part. `detail` is a {@link TimeValue}.
 */
class TimeColumns extends ThemableMixin(PolylitMixin(LitElement)) {
  declare config: TimeConfig;
  declare value: TimeValue | null;
  declare i18n: TimeColumnsI18n;

  static get is() {
    return 'dtcp-time-columns';
  }

  static get properties() {
    return {
      /** Which columns are shown and whether the clock is 12h. */
      config: {
        type: Object,
      },

      /** The currently selected time, or null when nothing is selected yet. */
      value: {
        type: Object,
      },

      /** Accessible names for the columns and AM/PM labels. */
      i18n: {
        type: Object,
      },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        overflow: hidden;
        height: 100%;
      }

      [part='column'] {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        scrollbar-width: none;
        outline: none;
        flex: 1 0 auto;
        scroll-behavior: smooth;
      }

      [part='column']::-webkit-scrollbar {
        display: none;
      }

      /* Allow the last item of each column to scroll to the top */
      [part='column']::after {
        content: '';
        flex: 0 0 calc(100% - var(--_dtcp-cell-height, 2rem));
      }

      [part~='time-cell'] {
        flex: none;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        text-align: center;
      }
    `;
  }

  constructor() {
    super();
    this.config = DEFAULT_CONFIG;
    this.value = null;
    this.i18n = {
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds',
      meridiem: 'AM/PM',
      am: 'AM',
      pm: 'PM',
    };
  }

  /** @protected */
  render() {
    const columns = this.__computeColumns();
    return html`
      ${columns.map(
        (kind) => html`
          <div
            part="column"
            data-column="${kind}"
            role="listbox"
            tabindex="0"
            aria-label="${this.__columnLabel(kind)}"
            aria-activedescendant="${this.__activeDescendant(kind) ?? nothing}"
            @keydown="${this.__onColumnKeyDown}"
          >
            ${this.__columnItems(kind).map((item, index) => {
              const selected = this.__isSelected(kind, item.value);
              return html`
                <div
                  id="${`${kind}-${index}`}"
                  part="time-cell ${selected ? 'time-cell-selected' : ''}"
                  role="option"
                  aria-selected="${String(selected)}"
                  data-value="${item.value}"
                  @click="${() => this.__select(kind, item.value)}"
                >
                  ${item.label}
                </div>
              `;
            })}
          </div>
        `,
      )}
    `;
  }

  /**
   * Scrolls every column so that its selected item is at the top.
   * Pass `instant = true` to jump without animation (used on overlay open).
   */
  scrollToValue(instant = false) {
    this.shadowRoot!.querySelectorAll<HTMLElement>('[part="column"]').forEach((column) => {
      const selected = column.querySelector<HTMLElement>('[part~="time-cell-selected"]');
      if (selected) {
        const top = selected.offsetTop - column.offsetTop;
        if (instant) {
          const behavior = column.style.scrollBehavior;
          column.style.scrollBehavior = 'auto';
          column.scrollTop = top;
          column.style.scrollBehavior = behavior;
        } else {
          column.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  }

  /** @private */
  __computeColumns(): ColumnKind[] {
    const columns: ColumnKind[] = [];
    const config = this.config || DEFAULT_CONFIG;
    if (config.showHours) {
      columns.push('hours');
    }
    if (config.showMinutes) {
      columns.push('minutes');
    }
    if (config.showSeconds) {
      columns.push('seconds');
    }
    if (config.showMeridiem) {
      columns.push('meridiem');
    }
    return columns;
  }

  /** @private */
  __columnLabel(kind: ColumnKind): string {
    return this.i18n[kind] ?? kind;
  }

  /** @private */
  __columnItems(kind: ColumnKind): ColumnItem[] {
    const pad2 = (n: number) => String(n).padStart(2, '0');
    switch (kind) {
      case 'hours':
        if (this.config.use12h) {
          // 12, 1, 2, ... 11 like a clock face reading
          return Array.from({ length: 12 }, (_, i) => {
            const display = i === 0 ? 12 : i;
            return { value: display, label: pad2(display) };
          });
        }
        return Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad2(i) }));
      case 'minutes':
        return Array.from({ length: 60 }, (_, i) => ({ value: i, label: pad2(i) }));
      case 'seconds':
        return Array.from({ length: 60 }, (_, i) => ({ value: i, label: pad2(i) }));
      case 'meridiem':
        return [
          { value: 'am', label: this.i18n.am },
          { value: 'pm', label: this.i18n.pm },
        ];
      default:
        return [];
    }
  }

  /** @private */
  __isSelected(kind: ColumnKind, itemValue: number | string): boolean {
    if (!this.value) {
      return false;
    }
    switch (kind) {
      case 'hours':
        if (this.config.use12h) {
          const hour12 = this.value.hours % 12 === 0 ? 12 : this.value.hours % 12;
          return itemValue === hour12;
        }
        return itemValue === this.value.hours;
      case 'minutes':
        return itemValue === this.value.minutes;
      case 'seconds':
        return itemValue === this.value.seconds;
      case 'meridiem':
        return itemValue === (this.value.hours < 12 ? 'am' : 'pm');
      default:
        return false;
    }
  }

  /** @private */
  __activeDescendant(kind: ColumnKind): string | undefined {
    const items = this.__columnItems(kind);
    const index = items.findIndex((item) => this.__isSelected(kind, item.value));
    return index >= 0 ? `${kind}-${index}` : undefined;
  }

  /** @private */
  __select(kind: ColumnKind, itemValue: number | string) {
    const current: TimeValue = this.value ?? { hours: 0, minutes: 0, seconds: 0 };
    const next: TimeValue = { ...current };

    switch (kind) {
      case 'hours': {
        if (this.config.use12h) {
          const pm = current.hours >= 12;
          const hour12 = itemValue as number;
          next.hours = (hour12 % 12) + (pm ? 12 : 0);
        } else {
          next.hours = itemValue as number;
        }
        break;
      }
      case 'minutes':
        next.minutes = itemValue as number;
        break;
      case 'seconds':
        next.seconds = itemValue as number;
        break;
      case 'meridiem': {
        const pm = itemValue === 'pm';
        next.hours = (next.hours % 12) + (pm ? 12 : 0);
        break;
      }
      default:
        break;
    }

    this.value = next;
    this.dispatchEvent(new CustomEvent('time-changed', { detail: next }));
    // Re-render happens synchronously enough for smooth scroll on next frame
    requestAnimationFrame(() => this.scrollToValue());
  }

  /** @private */
  __onColumnKeyDown(event: KeyboardEvent) {
    const column = event.currentTarget as HTMLElement;
    const kind = column.dataset.column as ColumnKind;
    const items = this.__columnItems(kind);
    const currentIndex = items.findIndex((item) => this.__isSelected(kind, item.value));

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = Math.min(items.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(0, currentIndex === -1 ? 0 : currentIndex - 1);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    if (nextIndex !== null && nextIndex !== currentIndex) {
      this.__select(kind, items[nextIndex].value);
    }
  }
}

defineCustomElement(TimeColumns);

export { TimeColumns };
