/**
 * @license
 * Copyright (c) 2016 - 2026 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 *
 * Forked for DateTimeComboPicker from vaadin/web-components v25.2.7
 * (packages/date-picker/src/vaadin-month-calendar.js). See NOTICE.
 * Changes: retagged to <dtcp-month-calendar>, imports rewired to the local
 * vendor modules, LumoInjectionMixin dropped (its injection is keyed by tag
 * name and would be inert for the renamed tag), and render() made defensive
 * about not-yet-computed properties.
 */
import { html, LitElement } from 'lit';
import { defineCustomElement } from '@vaadin/component-base/src/define.js';
import { PolylitMixin } from '@vaadin/component-base/src/polylit-mixin.js';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin/vaadin-themable-mixin.js';
import { monthCalendarStyles } from './month-calendar-styles.js';
import { MonthCalendarMixin } from './month-calendar-mixin.js';

/**
 * @customElement dtcp-month-calendar
 * @extends HTMLElement
 * @private
 */
class MonthCalendar extends MonthCalendarMixin(ThemableMixin(PolylitMixin(LitElement))) {
  static get is() {
    return 'dtcp-month-calendar';
  }

  static get styles() {
    return monthCalendarStyles;
  }

  /** @protected */
  render() {
    const weekDayNames = this.__computeWeekDayNames(this.i18n, this.showWeekNumbers) || [];
    const weeks = this._weeks || [];
    const hideWeekSeparator = !this.__computeShowWeekSeparator(this.showWeekNumbers, this.i18n);

    return html`
      <div part="month-header" id="month-header" aria-hidden="true">${this._getTitle(this.month, this.i18n)}</div>
      <table
        id="monthGrid"
        role="grid"
        aria-labelledby="month-header"
        @touchend="${this._preventDefault}"
        @touchstart="${this._onMonthGridTouchStart}"
      >
        <thead id="weekdays-container">
          <tr role="row" part="weekdays">
            <th part="weekday" aria-hidden="true" ?hidden="${hideWeekSeparator}"></th>
            ${weekDayNames.map(
              (item) => html`
                <th role="columnheader" part="weekday" scope="col" abbr="${item.weekDay}" aria-hidden="true">
                  ${item.weekDayShort}
                </th>
              `,
            )}
          </tr>
        </thead>
        <tbody id="days-container">
          ${weeks.map(
            (week) => html`
              <tr role="row">
                <td part="week-number" aria-hidden="true" ?hidden="${hideWeekSeparator}">
                  ${this.__computeWeekNumber(week)}
                </td>
                ${week.map((date) => {
                  return html`
                    <td
                      role="gridcell"
                      part="${this.__computeDatePart(
                        date,
                        this.focusedDate,
                        this.selectedDate,
                        this.minDate,
                        this.maxDate,
                        this.isDateDisabled,
                        this.enteredDate,
                        this.__hasFocus,
                      )}"
                      .date="${date}"
                      ?disabled="${this.__isDayDisabled(date, this.minDate, this.maxDate, this.isDateDisabled)}"
                      tabindex="${this.__computeDayTabIndex(date, this.focusedDate)}"
                      aria-selected="${this.__computeDayAriaSelected(date, this.selectedDate)}"
                      aria-disabled="${this.__computeDayAriaDisabled(
                        date,
                        this.minDate,
                        this.maxDate,
                        this.isDateDisabled,
                      )}"
                      aria-label="${this.__computeDayAriaLabel(date)}"
                      >${this._getDate(date)}</td
                    >
                  `;
                })}
              </tr>
            `,
          )}
        </tbody>
      </table>
    `;
  }
}

defineCustomElement(MonthCalendar);
