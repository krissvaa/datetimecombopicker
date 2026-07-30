/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Layout inspired by the MUI X DateTimePicker desktop view
 * (calendar on the left, time columns on the right).
 */
import { css, html, LitElement, nothing } from 'lit';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import './vendor/dtcp-month-calendar.js';
import './dtcp-time-columns.js';
import type { TimeColumns, TimeValue } from './dtcp-time-columns.js';
import type { TimeConfig } from './dtcp-format.js';

export interface DtcpI18n {
  monthNames: string[];
  weekdays: string[];
  weekdaysShort: string[];
  firstDayOfWeek: number;
  today: string;
  formatTitle: (monthName: string, fullYear: number) => string;
  prevMonth: string;
  nextMonth: string;
  hours: string;
  minutes: string;
  seconds: string;
  meridiem: string;
  am: string;
  pm: string;
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
  formatTitle: (monthName, fullYear) => `${monthName} ${fullYear}`,
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  meridiem: 'AM/PM',
  am: 'AM',
  pm: 'PM',
};

/**
 * `<dtcp-overlay-content>` lays out the month calendar and the time columns
 * side by side inside the `<date-time-combo-picker>` popup.
 * An internal element, not intended to be used separately.
 *
 * @fires date-selected - `detail.date` is the tapped `Date`.
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
  declare _displayedMonth: Date;

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

      /** @protected */
      _displayedMonth: {
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
        box-sizing: border-box;
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

      /* The month calendar renders its own (redundant) title */
      dtcp-month-calendar::part(month-header) {
        position: absolute;
        clip: rect(0, 0, 0, 0);
        overflow: hidden;
        width: 1px;
        height: 1px;
        margin: -1px;
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
    this._displayedMonth = new Date();
  }

  /** @protected */
  render() {
    const config = this.timeConfig;
    const month = this._displayedMonth;
    const title = this.i18n.formatTitle(this.i18n.monthNames[month.getMonth()], month.getFullYear());

    return html`
      <div part="calendar-section" ?hidden="${!config.hasDate}">
        <div part="calendar-header">
          <button part="prev-month-button" aria-label="${this.i18n.prevMonth}" @click="${this.__prevMonth}"></button>
          <div part="month-year-label" aria-live="polite">${title}</div>
          <button part="next-month-button" aria-label="${this.i18n.nextMonth}" @click="${this.__nextMonth}"></button>
        </div>
        <dtcp-month-calendar
          .month="${month}"
          .selectedDate="${this.selectedDate ?? undefined}"
          .focusedDate="${this.selectedDate ?? undefined}"
          .i18n="${this.i18n}"
          .minDate="${this.minDate}"
          .maxDate="${this.maxDate}"
          .showWeekNumbers="${this.showWeekNumbers}"
          @date-tap="${this.__onDateTap}"
        ></dtcp-month-calendar>
        <div part="calendar-footer">
          <button part="today-button" @click="${this.__onTodayClick}">${this.i18n.today}</button>
        </div>
      </div>
      <div part="time-section" ?hidden="${!config.hasTime}">
        <dtcp-time-columns
          .config="${config}"
          .value="${this.timeValue}"
          .i18n="${{
            hours: this.i18n.hours,
            minutes: this.i18n.minutes,
            seconds: this.i18n.seconds,
            meridiem: this.i18n.meridiem,
            am: this.i18n.am,
            pm: this.i18n.pm,
          }}"
          @time-changed="${this.__onTimeChanged}"
        ></dtcp-time-columns>
      </div>
      ${nothing}
    `;
  }

  /** Resets the displayed month and scrolls time columns; called when the overlay opens. */
  initialize() {
    const position = this.selectedDate ?? this.initialPosition ?? new Date();
    this._displayedMonth = new Date(position.getFullYear(), position.getMonth(), 1);
    const columns = this.shadowRoot!.querySelector<TimeColumns>('dtcp-time-columns');
    if (columns) {
      requestAnimationFrame(() => columns.scrollToValue(true));
    }
  }

  /** @private */
  __selectedDateChanged(date: Date | null) {
    if (date) {
      this._displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }
  }

  /** @private */
  __prevMonth() {
    const m = this._displayedMonth;
    this._displayedMonth = new Date(m.getFullYear(), m.getMonth() - 1, 1);
  }

  /** @private */
  __nextMonth() {
    const m = this._displayedMonth;
    this._displayedMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1);
  }

  /** @private */
  __onDateTap(event: CustomEvent<{ date: Date }>) {
    this.dispatchEvent(new CustomEvent('date-selected', { detail: { date: event.detail.date } }));
  }

  /** @private */
  __onTodayClick() {
    this.dispatchEvent(new CustomEvent('date-selected', { detail: { date: new Date() } }));
  }

  /** @private */
  __onTimeChanged(event: CustomEvent<TimeValue>) {
    this.dispatchEvent(new CustomEvent('time-selected', { detail: event.detail }));
  }
}

defineCustomElement(DtcpOverlayContent);

export { DtcpOverlayContent };
