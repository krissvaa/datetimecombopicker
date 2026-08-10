/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Combined popup layout: calendar on the left, time selector on the
 * right (stacked vertically in fullscreen mode). Keyboard navigation
 * modeled on vaadin-date-picker.
 */
import { css, html, LitElement, nothing } from 'lit';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import './vendor/dtcp-month-calendar.js';
import './dtcp-time-columns.js';
import './dtcp-time-clock.js';
import { dateAllowed, dateEquals } from './vendor/date-picker-helper.js';
import type { TimeColumns, TimeSteps, TimeValue } from './dtcp-time-columns.js';
import type { TimeClock } from './dtcp-time-clock.js';
import type { TimeConfig } from './dtcp-format.js';

export type TimeViewKind = 'columns' | 'clock';

export type IsDateDisabledFn = (date: { day: number; month: number; year: number }) => boolean;

export interface DtcpI18n {
  monthNames: string[];
  weekdays: string[];
  weekdaysShort: string[];
  firstDayOfWeek: number;
  today: string;
  year: string;
  ok: string;
  cancel: string;
  formatTitle: (monthName: string, fullYear: number) => string;
  prevMonth: string;
  nextMonth: string;
  /** Label of the Date tab in the fullscreen tabbed layout. */
  dateTab: string;
  /** Label of the Time tab in the fullscreen tabbed layout. */
  timeTab: string;
  hours: string;
  minutes: string;
  seconds: string;
  meridiem: string;
  am: string;
  pm: string;
  /** Error message shown when the typed text does not match the format. Empty: use `errorMessage`. */
  badInputErrorMessage: string;
  /** Error message shown when a required field is empty. Empty: use `errorMessage`. */
  requiredErrorMessage: string;
  /** Error message shown when the value is earlier than `min`. Empty: use `errorMessage`. */
  minErrorMessage: string;
  /** Error message shown when the value is later than `max`. Empty: use `errorMessage`. */
  maxErrorMessage: string;
  /** Error message shown when the value's date is disabled via `isDateDisabled`. Empty: use `errorMessage`. */
  dateDisabledErrorMessage: string;
}

export const DEFAULT_I18N: DtcpI18n = {
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  firstDayOfWeek: 0,
  today: 'Today',
  year: 'Year',
  ok: 'OK',
  cancel: 'Cancel',
  formatTitle: (monthName, fullYear) => `${monthName} ${fullYear}`,
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  dateTab: 'Date',
  timeTab: 'Time',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  meridiem: 'AM/PM',
  am: 'AM',
  pm: 'PM',
  badInputErrorMessage: '',
  requiredErrorMessage: '',
  minErrorMessage: '',
  maxErrorMessage: '',
  dateDisabledErrorMessage: '',
};

const MIN_YEAR = 1900;
const MAX_YEAR = 2099;

interface MonthCalendarElement extends HTMLElement {
  focusableDateElement?: HTMLElement;
  updateComplete: Promise<boolean>;
}

/**
 * `<dtcp-overlay-content>` lays out the month calendar and the time columns
 * side by side inside the `<date-time-combo-picker>` popup, with an
 * alternative year-grid view for fast year navigation. In fullscreen mode
 * with `mobileTabs`, the sections are shown one at a time behind Date/Time
 * tabs with the formatted value above.
 * An internal element, not intended to be used separately.
 *
 * @fires date-selected - `detail.date` is the selected `Date`.
 * @fires time-selected - `detail` is a `TimeValue`.
 *
 * @private
 */
class DtcpOverlayContent extends ThemableMixin(PolylitMixin(LitElement)) {
  declare selectedDate: Date | null;
  declare timeValue: TimeValue | null;
  declare timeConfig: TimeConfig;
  declare i18n: DtcpI18n;
  declare minDate: Date | null;
  declare maxDate: Date | null;
  declare showWeekNumbers: boolean;
  declare initialPosition: Date | null;
  declare focusedDate: Date | null;
  declare isDateDisabled: IsDateDisabledFn | undefined;
  declare steps: TimeSteps;
  declare referenceTime: TimeValue | null;
  declare showActions: boolean;
  declare okButtonHidden: boolean;
  declare cancelButtonHidden: boolean;
  declare timeView: TimeViewKind;
  declare autoAdvanceDisabled: boolean;
  declare autoAdvanceDelay: number;
  declare fullscreen: boolean;
  declare mobileTabs: boolean;
  declare headerText: string;
  declare _displayedMonth: Date;
  declare _yearViewOpen: boolean;
  declare _activeTab: 'date' | 'time';

  static get is() {
    return 'dtcp-overlay-content';
  }

  static get properties() {
    return {
      /** Currently selected date (date part of the picker value). */
      selectedDate: {
        type: Object,
        observer: '__selectedDateChanged',
      },

      /** Currently selected time (time part of the picker value). */
      timeValue: {
        type: Object,
      },

      /** Which time columns to show / 12h mode / whether calendar is shown. */
      timeConfig: {
        type: Object,
      },

      i18n: {
        type: Object,
      },

      minDate: {
        type: Object,
      },

      maxDate: {
        type: Object,
      },

      showWeekNumbers: {
        type: Boolean,
      },

      /** Month to display when there is no selected date. */
      initialPosition: {
        type: Object,
      },

      /** The date that keyboard navigation focuses in the calendar. */
      focusedDate: {
        type: Object,
      },

      /** A function that disables individual dates ({day, month, year}, month 0-based). */
      isDateDisabled: {
        type: Object,
      },

      /** Interval between the items of each time column. */
      steps: {
        type: Object,
      },

      /** The time used for parts not yet chosen on the first selection. */
      referenceTime: {
        type: Object,
      },

      /** Whether the Cancel/OK action bar is shown. */
      showActions: {
        type: Boolean,
      },

      /** Hides the OK button of the action bar. */
      okButtonHidden: {
        type: Boolean,
      },

      /** Hides the Cancel button of the action bar. */
      cancelButtonHidden: {
        type: Boolean,
      },

      /** The time selector to render: scroll columns or an analog clock. */
      timeView: {
        type: String,
      },

      /** When true, the analog clock does not auto-advance to the next view. */
      autoAdvanceDisabled: {
        type: Boolean,
      },

      /** Delay in milliseconds before the analog clock auto-advances. */
      autoAdvanceDelay: {
        type: Number,
      },

      /** Whether the popup is in fullscreen (mobile bottom sheet) mode. */
      fullscreen: {
        type: Boolean,
        reflectToAttribute: true,
      },

      /**
       * When true and both a date and a time part exist, the fullscreen
       * layout shows Date/Time tabs (one section at a time) instead of
       * stacking the calendar above the time selector.
       */
      mobileTabs: {
        type: Boolean,
      },

      /** The formatted value shown above the tabs while choosing. */
      headerText: {
        type: String,
      },

      /** @protected */
      _displayedMonth: {
        type: Object,
      },

      /** @protected */
      _yearViewOpen: {
        type: Boolean,
      },

      /** @protected */
      _activeTab: {
        type: String,
      },
    };
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        /* Natural height: the popup sizes to the content and scrolls when
           the viewport clamps the overlay */
        height: auto;
        box-sizing: border-box;
      }

      [part='main'] {
        display: flex;
        flex: auto;
        min-height: 0;
        overflow: hidden;
      }

      [part='tabs-header'] {
        flex: none;
        text-align: center;
      }

      [part='tabs'] {
        display: flex;
        flex: none;
      }

      [part~='tab'] {
        flex: 1 1 0;
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      [part='action-bar'] {
        display: flex;
        align-items: center;
        flex: none;
      }

      /* Pushes the Cancel/OK buttons to the end, past any slotted content */
      [part='action-bar-spacer'] {
        flex: 1 1 auto;
      }

      [part$='-action-button'] {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      /* Fullscreen (mobile): stack the calendar above the time columns */
      :host([fullscreen]) [part='main'] {
        flex-direction: column;
      }

      :host([fullscreen]) [part='time-section'] {
        justify-content: center;
      }

      [part='calendar-section'] {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
      }

      [part='calendar-header'] {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: none;
      }

      [part='month-year-label'] {
        flex: auto;
        text-align: center;
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      [part$='month-button'] {
        flex: none;
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      dtcp-month-calendar {
        flex: auto;
      }

      /* In the fixed-height fullscreen section, don't stretch the calendar:
         stretching parks the leftover space between the last week row and
         the Today button */
      :host([fullscreen]) dtcp-month-calendar {
        flex: none;
      }

      /* The month calendar renders its own (redundant) title */
      dtcp-month-calendar::part(month-header) {
        position: absolute;
        clip: rect(0, 0, 0, 0);
        overflow: hidden;
        width: 1px;
        height: 1px;
        margin: -1px;
      }

      [part='year-grid'] {
        flex: auto;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        align-content: start;
      }

      [part~='year-cell'] {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }

      [part='time-section'] {
        display: flex;
        flex: none;
        overflow: hidden;
      }

      [hidden] {
        display: none !important;
      }
    `;
  }

  constructor() {
    super();
    this.selectedDate = null;
    this.timeValue = null;
    this.isDateDisabled = undefined;
    this.steps = { hours: 1, minutes: 1, seconds: 1 };
    this.referenceTime = null;
    this.showActions = false;
    this.okButtonHidden = false;
    this.cancelButtonHidden = false;
    this.timeView = 'columns';
    this.autoAdvanceDisabled = false;
    this.autoAdvanceDelay = 300;
    this.fullscreen = false;
    this.mobileTabs = false;
    this.headerText = '';
    this._activeTab = 'date';
    this.timeConfig = {
      hasDate: true,
      hasTime: true,
      use12h: false,
      showHours: true,
      showMinutes: true,
      showSeconds: false,
      showMeridiem: false,
    };
    this.i18n = DEFAULT_I18N;
    this.minDate = null;
    this.maxDate = null;
    this.showWeekNumbers = false;
    this.initialPosition = null;
    this.focusedDate = null;
    this._displayedMonth = new Date();
    this._yearViewOpen = false;
  }

  /** Whether the fullscreen Date/Time tabs are in effect. @private */
  __tabsActive(): boolean {
    return this.fullscreen && this.mobileTabs && this.timeConfig.hasDate && this.timeConfig.hasTime;
  }

  /** @protected */
  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // Styling hook for the tabbed fullscreen layout
    this.toggleAttribute('tabs', this.__tabsActive());
  }

  /** @protected */
  render() {
    const config = this.timeConfig;
    const month = this._displayedMonth;
    const title = this.i18n.formatTitle(this.i18n.monthNames[month.getMonth()], month.getFullYear());
    const tabs = this.__tabsActive();

    return html`
      ${tabs
        ? html`
            <div part="tabs-header">${this.headerText}</div>
            <div part="tabs" role="tablist">
              <button
                part="tab date-tab ${this._activeTab === 'date' ? 'tab-selected' : ''}"
                role="tab"
                aria-selected="${String(this._activeTab === 'date')}"
                @click="${() => this.__setActiveTab('date')}"
              >
                ${this.i18n.dateTab}
              </button>
              <button
                part="tab time-tab ${this._activeTab === 'time' ? 'tab-selected' : ''}"
                role="tab"
                aria-selected="${String(this._activeTab === 'time')}"
                @click="${() => this.__setActiveTab('time')}"
              >
                ${this.i18n.timeTab}
              </button>
            </div>
          `
        : nothing}
      <div part="main">
      <div part="calendar-section" ?hidden="${!config.hasDate || (tabs && this._activeTab !== 'date')}">
        <div part="calendar-header">
          <button
            part="prev-month-button"
            aria-label="${this.i18n.prevMonth}"
            ?hidden="${this._yearViewOpen}"
            @click="${this.__prevMonth}"
          ></button>
          <button
            part="month-year-label"
            aria-live="polite"
            aria-expanded="${this._yearViewOpen ? 'true' : 'false'}"
            aria-label="${title}, ${this.i18n.year}"
            @click="${this.__toggleYearView}"
          >
            ${title}
          </button>
          <button
            part="next-month-button"
            aria-label="${this.i18n.nextMonth}"
            ?hidden="${this._yearViewOpen}"
            @click="${this.__nextMonth}"
          ></button>
        </div>
        ${this._yearViewOpen
          ? html`
              <div part="year-grid" role="listbox" aria-label="${this.i18n.year}" @keydown="${this.__onYearGridKeyDown}">
                ${this.__years().map(
                  (year) => html`
                    <button
                      part="year-cell ${year === month.getFullYear() ? 'year-cell-selected' : ''}"
                      role="option"
                      aria-selected="${String(year === month.getFullYear())}"
                      tabindex="${year === month.getFullYear() ? '0' : '-1'}"
                      data-year="${year}"
                      @click="${() => this.__selectYear(year)}"
                    >
                      ${year}
                    </button>
                  `,
                )}
              </div>
            `
          : html`
              <dtcp-month-calendar
                .month="${month}"
                .selectedDate="${this.selectedDate ?? undefined}"
                .focusedDate="${(this.focusedDate ?? this.selectedDate) ?? undefined}"
                .i18n="${this.i18n}"
                .minDate="${this.minDate}"
                .maxDate="${this.maxDate}"
                .isDateDisabled="${this.isDateDisabled ?? (() => false)}"
                .showWeekNumbers="${this.showWeekNumbers}"
                @date-tap="${this.__onDateTap}"
                @keydown="${this.__onCalendarKeyDown}"
              ></dtcp-month-calendar>
              <div part="calendar-footer">
                <button part="today-button" ?disabled="${!this.__todayAllowed()}" @click="${this.__onTodayClick}">
                  ${this.i18n.today}
                </button>
              </div>
            `}
      </div>
      <div part="time-section" ?hidden="${!config.hasTime || (tabs && this._activeTab !== 'time')}">
        ${this.timeView === 'clock'
          ? html`
              <dtcp-time-clock
                .config="${config}"
                .value="${this.timeValue}"
                .steps="${this.steps}"
                .fallbackValue="${this.referenceTime ?? { hours: 0, minutes: 0, seconds: 0 }}"
                .autoAdvanceDisabled="${this.autoAdvanceDisabled}"
                .autoAdvanceDelay="${this.autoAdvanceDelay}"
                .i18n="${this.__timeI18n()}"
                @time-changed="${this.__onTimeChanged}"
              ></dtcp-time-clock>
            `
          : html`
              <dtcp-time-columns
                .config="${config}"
                .value="${this.timeValue}"
                .steps="${this.steps}"
                .fallbackValue="${this.referenceTime ?? { hours: 0, minutes: 0, seconds: 0 }}"
                .i18n="${this.__timeI18n()}"
                @time-changed="${this.__onTimeChanged}"
              ></dtcp-time-columns>
            `}
      </div>
      </div>
      <div part="action-bar" ?hidden="${!this.showActions}">
        <slot name="action-bar"></slot>
        <div part="action-bar-spacer"></div>
        <button part="cancel-action-button" ?hidden="${this.cancelButtonHidden}" @click="${this.__onCancelClick}">
          ${this.i18n.cancel}
        </button>
        <button part="ok-action-button" ?hidden="${this.okButtonHidden}" @click="${this.__onOkClick}">
          ${this.i18n.ok}
        </button>
      </div>
      ${nothing}
    `;
  }

  /** @private */
  __onOkClick() {
    this.dispatchEvent(new CustomEvent('apply-action'));
  }

  /** @private */
  __onCancelClick() {
    this.dispatchEvent(new CustomEvent('cancel-action'));
  }

  /** Resets the view state and the time selector; called when the overlay opens. */
  initialize() {
    const position = this.selectedDate ?? this.initialPosition ?? new Date();
    this._displayedMonth = new Date(position.getFullYear(), position.getMonth(), 1);
    // Normalized to midnight: the focused date is compared against min/max
    // date boundaries, so a carried time-of-day would reject boundary days
    this.focusedDate = this.__normalize(position);
    this._yearViewOpen = false;
    this._activeTab = 'date';
    const columns = this.shadowRoot!.querySelector<TimeColumns>('dtcp-time-columns');
    if (columns) {
      requestAnimationFrame(() => columns.scrollToValue(true));
    }
    const clock = this.shadowRoot!.querySelector<TimeClock>('dtcp-time-clock');
    if (clock) {
      clock.initialize();
    }
  }

  /** @private */
  __timeI18n() {
    return {
      hours: this.i18n.hours,
      minutes: this.i18n.minutes,
      seconds: this.i18n.seconds,
      meridiem: this.i18n.meridiem,
      am: this.i18n.am,
      pm: this.i18n.pm,
    };
  }

  /** Moves keyboard focus onto the focused date cell of the calendar. */
  async focusDateCell() {
    if (this._yearViewOpen) {
      this.__focusSelectedYear();
      return;
    }
    if (!this.focusedDate) {
      this.focusedDate = this.selectedDate ?? this.__normalize(new Date());
    }
    await this.updateComplete;
    const calendar = this.__calendar();
    if (calendar) {
      await calendar.updateComplete;
      calendar.focusableDateElement?.focus();
    }
  }

  /** Moves keyboard focus onto the time selector (first column or clock face). */
  focusTimeColumns() {
    const columns = this.shadowRoot!.querySelector<TimeColumns>('dtcp-time-columns');
    if (columns) {
      columns.shadowRoot!.querySelector<HTMLElement>('[part="column"]')?.focus();
      return;
    }
    const clock = this.shadowRoot!.querySelector<TimeClock>('dtcp-time-clock');
    clock?.shadowRoot!.querySelector<HTMLElement>('[part="clock-face"]')?.focus();
  }

  /** @private */
  __calendar(): (MonthCalendarElement & HTMLElement) | null {
    return this.shadowRoot!.querySelector<MonthCalendarElement & HTMLElement>('dtcp-month-calendar');
  }

  /** @private */
  __normalize(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /** @private */
  __years(): number[] {
    return Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
  }

  /** @private */
  __selectedDateChanged(date: Date | null) {
    if (date) {
      this._displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      this.focusedDate = this.__normalize(date);
    }
  }

  /** @private */
  __prevMonth() {
    const m = this._displayedMonth;
    const previous = new Date(m.getFullYear(), m.getMonth() - 1, 1);
    if (previous.getFullYear() >= MIN_YEAR) {
      this._displayedMonth = previous;
    }
  }

  /** @private */
  __nextMonth() {
    const m = this._displayedMonth;
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    if (next.getFullYear() <= MAX_YEAR) {
      this._displayedMonth = next;
    }
  }

  /** @private */
  async __toggleYearView() {
    this._yearViewOpen = !this._yearViewOpen;
    if (this._yearViewOpen) {
      await this.updateComplete;
      const selected = this.shadowRoot!.querySelector<HTMLElement>('[part~="year-cell-selected"]');
      selected?.scrollIntoView({ block: 'center' });
    }
  }

  /** @private */
  async __focusSelectedYear() {
    await this.updateComplete;
    this.shadowRoot!.querySelector<HTMLElement>('[part~="year-cell-selected"]')?.focus();
  }

  /**
   * Roving keyboard navigation in the year grid (4 columns): arrows move by
   * one year / one row, Home/End jump to the range bounds.
   * @private
   */
  __onYearGridKeyDown(event: KeyboardEvent) {
    const target = event.composedPath()[0] as HTMLElement;
    const currentYear = Number(target?.dataset?.year);
    if (!Number.isInteger(currentYear)) {
      return;
    }

    let nextYear: number | null = null;
    const rtl = getComputedStyle(this).direction === 'rtl';
    switch (event.key) {
      case 'ArrowRight':
        nextYear = currentYear + (rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        nextYear = currentYear + (rtl ? 1 : -1);
        break;
      case 'ArrowDown':
        nextYear = currentYear + 4;
        break;
      case 'ArrowUp':
        nextYear = currentYear - 4;
        break;
      case 'Home':
        nextYear = MIN_YEAR;
        break;
      case 'End':
        nextYear = MAX_YEAR;
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    nextYear = Math.min(MAX_YEAR, Math.max(MIN_YEAR, nextYear));
    const cell = this.shadowRoot!.querySelector<HTMLElement>(`[data-year="${nextYear}"]`);
    if (cell) {
      cell.scrollIntoView({ block: 'nearest' });
      cell.focus();
    }
  }

  /** @private */
  async __selectYear(year: number) {
    const m = this._displayedMonth;
    this._displayedMonth = new Date(year, m.getMonth(), 1);
    if (this.focusedDate) {
      const f = this.focusedDate;
      // Clamp the day so e.g. Feb 29 doesn't roll over into March
      const lastDay = new Date(year, f.getMonth() + 1, 0).getDate();
      this.focusedDate = new Date(year, f.getMonth(), Math.min(f.getDate(), lastDay));
    }
    this._yearViewOpen = false;
    await this.focusDateCell();
  }

  /** Switches the fullscreen tab, restoring the time selector's scroll state. @private */
  __setActiveTab(tab: 'date' | 'time') {
    this._activeTab = tab;
    if (tab === 'time') {
      // The columns could not scroll while hidden (display: none)
      requestAnimationFrame(() => {
        this.shadowRoot!.querySelector<TimeColumns>('dtcp-time-columns')?.scrollToValue(true);
      });
    }
  }

  /** @private */
  __onDateTap(event: CustomEvent<{ date: Date }>) {
    this.dispatchEvent(new CustomEvent('date-selected', { detail: { date: event.detail.date } }));
    if (this.__tabsActive()) {
      // Like the Material mobile picker: continue with the time selection
      this.__setActiveTab('time');
    }
  }

  /** @private */
  __todayAllowed(): boolean {
    return dateAllowed(this.__normalize(new Date()), this.minDate, this.maxDate, this.isDateDisabled);
  }

  /** @private */
  __onTodayClick() {
    if (this.__todayAllowed()) {
      this.dispatchEvent(new CustomEvent('date-selected', { detail: { date: new Date() } }));
    }
  }

  /** @private */
  __onTimeChanged(event: CustomEvent<TimeValue>) {
    this.dispatchEvent(new CustomEvent('time-selected', { detail: event.detail }));
  }

  /** @private */
  async __moveFocusedDate(days: number, months: number, years: number) {
    const current = this.focusedDate ?? this.selectedDate ?? this.__normalize(new Date());
    const next = new Date(current);
    if (days !== 0) {
      next.setDate(next.getDate() + days);
    }
    if (months !== 0 || years !== 0) {
      // Keep the day of month when possible, clamp to the target month's length
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + months);
      next.setFullYear(next.getFullYear() + years);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(day, lastDay));
    }
    if (next.getFullYear() < MIN_YEAR || next.getFullYear() > MAX_YEAR) {
      return;
    }
    this.focusedDate = next;
    this._displayedMonth = new Date(next.getFullYear(), next.getMonth(), 1);
    await this.focusDateCell();
  }

  /** @private */
  __onCalendarKeyDown(event: KeyboardEvent) {
    const rtl = getComputedStyle(this).direction === 'rtl';
    let handled = true;

    switch (event.key) {
      case 'ArrowRight':
        this.__moveFocusedDate(rtl ? -1 : 1, 0, 0);
        break;
      case 'ArrowLeft':
        this.__moveFocusedDate(rtl ? 1 : -1, 0, 0);
        break;
      case 'ArrowDown':
        this.__moveFocusedDate(7, 0, 0);
        break;
      case 'ArrowUp':
        this.__moveFocusedDate(-7, 0, 0);
        break;
      case 'PageDown':
        this.__moveFocusedDate(0, event.shiftKey ? 0 : 1, event.shiftKey ? 1 : 0);
        break;
      case 'PageUp':
        this.__moveFocusedDate(0, event.shiftKey ? 0 : -1, event.shiftKey ? -1 : 0);
        break;
      case 'Home': {
        const m = this._displayedMonth;
        this.focusedDate = new Date(m.getFullYear(), m.getMonth(), 1);
        this.focusDateCell();
        break;
      }
      case 'End': {
        const m = this._displayedMonth;
        this.focusedDate = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        this.focusDateCell();
        break;
      }
      case 'Enter':
      case ' ': {
        const date = this.focusedDate;
        if (
          date &&
          dateAllowed(date, this.minDate, this.maxDate, this.isDateDisabled) &&
          !dateEquals(date, this.selectedDate)
        ) {
          this.dispatchEvent(new CustomEvent('date-selected', { detail: { date } }));
        }
        break;
      }
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}

defineCustomElement(DtcpOverlayContent);

export { DtcpOverlayContent };
