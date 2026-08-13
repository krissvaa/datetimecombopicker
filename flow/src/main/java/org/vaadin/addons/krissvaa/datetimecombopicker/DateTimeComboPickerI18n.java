/*
 * Copyright 2026 DateTimeComboPicker contributors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.vaadin.addons.krissvaa.datetimecombopicker;

import java.io.Serializable;
import java.util.List;

/**
 * Internationalization settings for {@link DateTimeComboPicker}. Any property
 * left {@code null} keeps the component's built-in (English) default.
 */
public class DateTimeComboPickerI18n implements Serializable {

    private List<String> monthNames;
    private List<String> weekdays;
    private List<String> weekdaysShort;
    private int firstDayOfWeek;
    private String today;
    private String year;
    private String ok;
    private String cancel;
    private String prevMonth;
    private String nextMonth;
    private String dateTab;
    private String timeTab;
    private String hours;
    private String minutes;
    private String seconds;
    private String meridiem;
    private String am;
    private String pm;
    private String badInputErrorMessage;
    private String requiredErrorMessage;
    private String minErrorMessage;
    private String maxErrorMessage;
    private String dateDisabledErrorMessage;

    /**
     * Gets the month names, January first.
     *
     * @return the month names, or {@code null} for the defaults
     */
    public List<String> getMonthNames() {
        return monthNames;
    }

    /**
     * Sets the month names, January first. Must contain 12 entries.
     *
     * @param monthNames
     *            the month names
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setMonthNames(List<String> monthNames) {
        this.monthNames = monthNames;
        return this;
    }

    /**
     * Gets the weekday names, Sunday first.
     *
     * @return the weekday names, or {@code null} for the defaults
     */
    public List<String> getWeekdays() {
        return weekdays;
    }

    /**
     * Sets the weekday names, Sunday first. Must contain 7 entries.
     *
     * @param weekdays
     *            the weekday names
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setWeekdays(List<String> weekdays) {
        this.weekdays = weekdays;
        return this;
    }

    /**
     * Gets the short weekday names, Sunday first.
     *
     * @return the short weekday names, or {@code null} for the defaults
     */
    public List<String> getWeekdaysShort() {
        return weekdaysShort;
    }

    /**
     * Sets the short weekday names, Sunday first. Must contain 7 entries.
     *
     * @param weekdaysShort
     *            the short weekday names
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setWeekdaysShort(
            List<String> weekdaysShort) {
        this.weekdaysShort = weekdaysShort;
        return this;
    }

    /**
     * Gets the first day of the week, 0 = Sunday ... 6 = Saturday.
     *
     * @return the first day of the week
     */
    public int getFirstDayOfWeek() {
        return firstDayOfWeek;
    }

    /**
     * Sets the first day of the week, 0 = Sunday ... 6 = Saturday.
     *
     * @param firstDayOfWeek
     *            the first day of the week
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setFirstDayOfWeek(int firstDayOfWeek) {
        this.firstDayOfWeek = firstDayOfWeek;
        return this;
    }

    /**
     * Gets the label of the "Today" button.
     *
     * @return the label, or {@code null} for the default
     */
    public String getToday() {
        return today;
    }

    /**
     * Sets the label of the "Today" button.
     *
     * @param today
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setToday(String today) {
        this.today = today;
        return this;
    }

    /**
     * Gets the accessible label of the year selector (the popup's month-year
     * header button and the year grid).
     *
     * @return the label, or {@code null} for the default
     */
    public String getYear() {
        return year;
    }

    /**
     * Sets the accessible label of the year selector.
     *
     * @param year
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setYear(String year) {
        this.year = year;
        return this;
    }

    /**
     * Gets the label of the OK button in the action bar (shown when
     * auto-apply is disabled).
     *
     * @return the label, or {@code null} for the default
     */
    public String getOk() {
        return ok;
    }

    /**
     * Sets the label of the OK button in the action bar.
     *
     * @param ok
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setOk(String ok) {
        this.ok = ok;
        return this;
    }

    /**
     * Gets the label of the Cancel button in the action bar (shown when
     * auto-apply is disabled).
     *
     * @return the label, or {@code null} for the default
     */
    public String getCancel() {
        return cancel;
    }

    /**
     * Sets the label of the Cancel button in the action bar.
     *
     * @param cancel
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setCancel(String cancel) {
        this.cancel = cancel;
        return this;
    }

    /**
     * Gets the accessible label of the previous-month button.
     *
     * @return the label, or {@code null} for the default
     */
    public String getPrevMonth() {
        return prevMonth;
    }

    /**
     * Sets the accessible label of the previous-month button.
     *
     * @param prevMonth
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setPrevMonth(String prevMonth) {
        this.prevMonth = prevMonth;
        return this;
    }

    /**
     * Gets the accessible label of the next-month button.
     *
     * @return the label, or {@code null} for the default
     */
    public String getNextMonth() {
        return nextMonth;
    }

    /**
     * Sets the accessible label of the next-month button.
     *
     * @param nextMonth
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setNextMonth(String nextMonth) {
        this.nextMonth = nextMonth;
        return this;
    }

    /**
     * Gets the label of the Date tab in the tabbed fullscreen layout (see
     * {@link DateTimeComboPicker#setMobileTabs(boolean)}).
     *
     * @return the label, or {@code null} for the default
     */
    public String getDateTab() {
        return dateTab;
    }

    /**
     * Sets the label of the Date tab in the tabbed fullscreen layout (see
     * {@link DateTimeComboPicker#setMobileTabs(boolean)}).
     *
     * @param dateTab
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setDateTab(String dateTab) {
        this.dateTab = dateTab;
        return this;
    }

    /**
     * Gets the label of the Time tab in the tabbed fullscreen layout (see
     * {@link DateTimeComboPicker#setMobileTabs(boolean)}).
     *
     * @return the label, or {@code null} for the default
     */
    public String getTimeTab() {
        return timeTab;
    }

    /**
     * Sets the label of the Time tab in the tabbed fullscreen layout (see
     * {@link DateTimeComboPicker#setMobileTabs(boolean)}).
     *
     * @param timeTab
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setTimeTab(String timeTab) {
        this.timeTab = timeTab;
        return this;
    }

    /**
     * Gets the accessible label of the hours column.
     *
     * @return the label, or {@code null} for the default
     */
    public String getHours() {
        return hours;
    }

    /**
     * Sets the accessible label of the hours column.
     *
     * @param hours
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setHours(String hours) {
        this.hours = hours;
        return this;
    }

    /**
     * Gets the accessible label of the minutes column.
     *
     * @return the label, or {@code null} for the default
     */
    public String getMinutes() {
        return minutes;
    }

    /**
     * Sets the accessible label of the minutes column.
     *
     * @param minutes
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setMinutes(String minutes) {
        this.minutes = minutes;
        return this;
    }

    /**
     * Gets the accessible label of the seconds column.
     *
     * @return the label, or {@code null} for the default
     */
    public String getSeconds() {
        return seconds;
    }

    /**
     * Sets the accessible label of the seconds column.
     *
     * @param seconds
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setSeconds(String seconds) {
        this.seconds = seconds;
        return this;
    }

    /**
     * Gets the accessible label of the AM/PM column.
     *
     * @return the label, or {@code null} for the default
     */
    public String getMeridiem() {
        return meridiem;
    }

    /**
     * Sets the accessible label of the AM/PM column.
     *
     * @param meridiem
     *            the label
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setMeridiem(String meridiem) {
        this.meridiem = meridiem;
        return this;
    }

    /**
     * Gets the AM marker text.
     *
     * @return the text, or {@code null} for the default
     */
    public String getAm() {
        return am;
    }

    /**
     * Sets the AM marker text shown in the AM/PM column.
     *
     * @param am
     *            the text
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setAm(String am) {
        this.am = am;
        return this;
    }

    /**
     * Gets the PM marker text.
     *
     * @return the text, or {@code null} for the default
     */
    public String getPm() {
        return pm;
    }

    /**
     * Sets the PM marker text shown in the AM/PM column.
     *
     * @param pm
     *            the text
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setPm(String pm) {
        this.pm = pm;
        return this;
    }

    /**
     * Gets the error message shown when the typed text does not match the
     * format pattern.
     *
     * @return the message, or {@code null} to use the generic error message
     */
    public String getBadInputErrorMessage() {
        return badInputErrorMessage;
    }

    /**
     * Sets the error message shown when the typed text does not match the
     * format pattern. When not set, the generic
     * {@link DateTimeComboPicker#setErrorMessage(String) error message} is
     * used.
     *
     * @param badInputErrorMessage
     *            the message
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setBadInputErrorMessage(
            String badInputErrorMessage) {
        this.badInputErrorMessage = badInputErrorMessage;
        return this;
    }

    /**
     * Gets the error message shown when a required field is left empty.
     *
     * @return the message, or {@code null} to use the generic error message
     */
    public String getRequiredErrorMessage() {
        return requiredErrorMessage;
    }

    /**
     * Sets the error message shown when a required field is left empty.
     * When not set, the generic error message is used.
     *
     * @param requiredErrorMessage
     *            the message
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setRequiredErrorMessage(
            String requiredErrorMessage) {
        this.requiredErrorMessage = requiredErrorMessage;
        return this;
    }

    /**
     * Gets the error message shown when the value is earlier than the
     * minimum.
     *
     * @return the message, or {@code null} to use the generic error message
     */
    public String getMinErrorMessage() {
        return minErrorMessage;
    }

    /**
     * Sets the error message shown when the value is earlier than the
     * minimum. When not set, the generic error message is used.
     *
     * @param minErrorMessage
     *            the message
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setMinErrorMessage(String minErrorMessage) {
        this.minErrorMessage = minErrorMessage;
        return this;
    }

    /**
     * Gets the error message shown when the value is later than the maximum.
     *
     * @return the message, or {@code null} to use the generic error message
     */
    public String getMaxErrorMessage() {
        return maxErrorMessage;
    }

    /**
     * Sets the error message shown when the value is later than the maximum.
     * When not set, the generic error message is used.
     *
     * @param maxErrorMessage
     *            the message
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setMaxErrorMessage(String maxErrorMessage) {
        this.maxErrorMessage = maxErrorMessage;
        return this;
    }

    /**
     * Gets the error message shown when the value's date is disabled via
     * {@link DateTimeComboPicker#setDateDisabledFunction(String)}.
     *
     * @return the message, or {@code null} to use the generic error message
     */
    public String getDateDisabledErrorMessage() {
        return dateDisabledErrorMessage;
    }

    /**
     * Sets the error message shown when the value's date is disabled via
     * {@link DateTimeComboPicker#setDateDisabledFunction(String)}. When not
     * set, the generic error message is used.
     *
     * @param dateDisabledErrorMessage
     *            the message
     * @return this instance for method chaining
     */
    public DateTimeComboPickerI18n setDateDisabledErrorMessage(
            String dateDisabledErrorMessage) {
        this.dateDisabledErrorMessage = dateDisabledErrorMessage;
        return this;
    }
}
