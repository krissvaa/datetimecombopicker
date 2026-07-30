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
package org.vaadin.addons.datetimecombopicker;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.vaadin.flow.component.AbstractSinglePropertyField;
import com.vaadin.flow.component.Focusable;
import com.vaadin.flow.component.HasHelper;
import com.vaadin.flow.component.HasLabel;
import com.vaadin.flow.component.HasPlaceholder;
import com.vaadin.flow.component.HasSize;
import com.vaadin.flow.component.HasStyle;
import com.vaadin.flow.component.HasTheme;
import com.vaadin.flow.component.HasValidation;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.component.shared.HasTooltip;

import elemental.json.Json;
import elemental.json.JsonArray;
import elemental.json.JsonObject;

/**
 * A combined date and time picker: a single field with a {@link LocalDateTime}
 * value whose popup shows a month calendar and sliding time columns side by
 * side (inspired by the MUI X DateTimePicker).
 *
 * <p>
 * The {@linkplain #setFormat(String) format pattern} defines both how the
 * value is displayed and parsed in the field, and which time columns are shown
 * in the popup: a pattern without {@code ss} shows no seconds column, a
 * pattern without {@code mm} shows no minutes column, and {@code h}/{@code hh}
 * (with {@code a}) uses a 12-hour clock with an AM/PM column.
 *
 * <p>
 * Supported pattern letters: {@code yyyy}/{@code yy}, {@code MM}/{@code M},
 * {@code dd}/{@code d}, {@code HH}/{@code H}, {@code hh}/{@code h},
 * {@code mm}/{@code m}, {@code ss}/{@code s} and {@code a}. Other characters
 * are literals; quote literal text with single quotes.
 *
 * <pre>
 * DateTimeComboPicker picker = new DateTimeComboPicker("Meeting");
 * picker.setFormat("dd.MM.yyyy HH:mm");
 * picker.setValue(LocalDateTime.now());
 * picker.addValueChangeListener(e -&gt; ...);
 * </pre>
 */
@Tag("date-time-combo-picker")
@JsModule("./date-time-combo-picker/date-time-combo-picker-lumo.js")
public class DateTimeComboPicker
        extends AbstractSinglePropertyField<DateTimeComboPicker, LocalDateTime>
        implements HasSize, HasStyle, HasLabel, HasHelper, HasValidation,
        HasTheme, HasTooltip, HasPlaceholder, Focusable<DateTimeComboPicker> {

    /**
     * The default format pattern, {@value}.
     */
    public static final String DEFAULT_FORMAT = "dd.MM.yyyy HH:mm";

    private DateTimeComboPickerI18n i18n;

    /**
     * Creates a new picker with no value and the default format
     * ({@value #DEFAULT_FORMAT}).
     */
    public DateTimeComboPicker() {
        super("value", null, String.class,
                DateTimeComboPicker::parsePresentationValue,
                DateTimeComboPicker::formatPresentationValue);
    }

    /**
     * Creates a new picker with the given label.
     *
     * @param label
     *            the field label
     */
    public DateTimeComboPicker(String label) {
        this();
        setLabel(label);
    }

    /**
     * Creates a new picker with the given label and initial value.
     *
     * @param label
     *            the field label
     * @param initialValue
     *            the initial value, may be {@code null}
     */
    public DateTimeComboPicker(String label, LocalDateTime initialValue) {
        this(label);
        setValue(initialValue);
    }

    private static LocalDateTime parsePresentationValue(String value) {
        return value == null || value.isEmpty() ? null
                : LocalDateTime.parse(value);
    }

    private static String formatPresentationValue(LocalDateTime value) {
        return value == null ? ""
                : value.truncatedTo(ChronoUnit.SECONDS).toString();
    }

    /**
     * Sets the date-time format pattern, e.g. {@code dd.MM.yyyy HH:mm:ss} or
     * {@code M/d/yyyy h:mm a}. The pattern defines how the value is displayed
     * and parsed in the field, and which time columns are shown in the popup.
     *
     * @param format
     *            the format pattern, or {@code null} to use the default
     *            ({@value #DEFAULT_FORMAT})
     */
    public void setFormat(String format) {
        getElement().setProperty("format",
                format == null ? DEFAULT_FORMAT : format);
    }

    /**
     * Gets the date-time format pattern.
     *
     * @return the format pattern
     */
    public String getFormat() {
        return getElement().getProperty("format", DEFAULT_FORMAT);
    }

    /**
     * Sets the earliest allowed date-time.
     *
     * @param min
     *            the minimum value, or {@code null} for no limit
     */
    public void setMin(LocalDateTime min) {
        getElement().setProperty("min",
                min == null ? "" : formatPresentationValue(min));
    }

    /**
     * Gets the earliest allowed date-time.
     *
     * @return the minimum value, or {@code null} if not set
     */
    public LocalDateTime getMin() {
        return parsePresentationValue(getElement().getProperty("min", ""));
    }

    /**
     * Sets the latest allowed date-time.
     *
     * @param max
     *            the maximum value, or {@code null} for no limit
     */
    public void setMax(LocalDateTime max) {
        getElement().setProperty("max",
                max == null ? "" : formatPresentationValue(max));
    }

    /**
     * Gets the latest allowed date-time.
     *
     * @return the maximum value, or {@code null} if not set
     */
    public LocalDateTime getMax() {
        return parsePresentationValue(getElement().getProperty("max", ""));
    }

    /**
     * Sets whether the popup opens when the field is clicked or typed in. When
     * disabled, the popup only opens from the toggle button.
     *
     * @param autoOpen
     *            {@code true} to open the popup on field interaction
     */
    public void setAutoOpen(boolean autoOpen) {
        getElement().setProperty("autoOpenDisabled", !autoOpen);
    }

    /**
     * Gets whether the popup opens on field interaction.
     *
     * @return {@code true} if auto-open is enabled
     */
    public boolean isAutoOpen() {
        return !getElement().getProperty("autoOpenDisabled", false);
    }

    /**
     * Opens or closes the popup.
     *
     * @param opened
     *            {@code true} to open, {@code false} to close
     */
    public void setOpened(boolean opened) {
        getElement().setProperty("opened", opened);
    }

    /**
     * Gets whether the popup is open.
     *
     * @return {@code true} if the popup is open
     */
    public boolean isOpened() {
        return getElement().getProperty("opened", false);
    }

    /**
     * Sets whether a clear button is shown when the field has a value.
     *
     * @param clearButtonVisible
     *            {@code true} to show the clear button
     */
    public void setClearButtonVisible(boolean clearButtonVisible) {
        getElement().setProperty("clearButtonVisible", clearButtonVisible);
    }

    /**
     * Gets whether the clear button is visible.
     *
     * @return {@code true} if the clear button is visible
     */
    public boolean isClearButtonVisible() {
        return getElement().getProperty("clearButtonVisible", false);
    }

    /**
     * Sets the interval between the items of the hours column, e.g. 6 shows
     * 00, 06, 12, 18. Values that divide 24 evenly produce a uniform column.
     *
     * @param hourStep
     *            the hour interval, at least 1
     */
    public void setHourStep(int hourStep) {
        if (hourStep < 1) {
            throw new IllegalArgumentException("hourStep must be at least 1");
        }
        getElement().setProperty("hourStep", hourStep);
    }

    /**
     * Gets the interval between the items of the hours column.
     *
     * @return the hour interval
     */
    public int getHourStep() {
        return getElement().getProperty("hourStep", 1);
    }

    /**
     * Sets the interval between the items of the minutes column, e.g. 5 shows
     * 00, 05, 10, ... 55. Values that divide 60 evenly produce a uniform
     * column.
     *
     * @param minuteStep
     *            the minute interval, at least 1
     */
    public void setMinuteStep(int minuteStep) {
        if (minuteStep < 1) {
            throw new IllegalArgumentException("minuteStep must be at least 1");
        }
        getElement().setProperty("minuteStep", minuteStep);
    }

    /**
     * Gets the interval between the items of the minutes column.
     *
     * @return the minute interval
     */
    public int getMinuteStep() {
        return getElement().getProperty("minuteStep", 1);
    }

    /**
     * Sets the interval between the items of the seconds column.
     *
     * @param secondStep
     *            the second interval, at least 1
     */
    public void setSecondStep(int secondStep) {
        if (secondStep < 1) {
            throw new IllegalArgumentException("secondStep must be at least 1");
        }
        getElement().setProperty("secondStep", secondStep);
    }

    /**
     * Gets the interval between the items of the seconds column.
     *
     * @return the second interval
     */
    public int getSecondStep() {
        return getElement().getProperty("secondStep", 1);
    }

    /**
     * Sets a client-side function that determines whether a given date is
     * disabled. Disabled dates cannot be selected in the calendar and make
     * the field invalid.
     *
     * <p>
     * The argument must be a JavaScript function expression that receives a
     * {@code { day, month, year }} object (where {@code month} is
     * <b>0-based</b>) and returns {@code true} to disable the date. Example
     * disabling weekends:
     *
     * <pre>
     * picker.setDateDisabledFunction(
     *         "(d) => [0, 6].includes(new Date(d.year, d.month, d.day).getDay())");
     * </pre>
     *
     * <p>
     * Note: the expression is evaluated in the browser. Since the function
     * runs client-side, always re-validate values on the server when the
     * dates carry security or business meaning. Passing {@code null} removes
     * the function.
     *
     * @param jsFunctionExpression
     *            a JavaScript function expression, or {@code null} to remove
     */
    public void setDateDisabledFunction(String jsFunctionExpression) {
        if (jsFunctionExpression == null) {
            getElement().executeJs("this.isDateDisabled = undefined;");
        } else {
            getElement().executeJs(
                    "this.isDateDisabled = (" + jsFunctionExpression + ");");
        }
    }

    /**
     * Sets the date-time that the popup shows initially, and that provides
     * the date/time parts not yet chosen by the user, when the field has no
     * value. Defaults to the current date-time.
     *
     * @param initialPosition
     *            the initial position, or {@code null} to use the current
     *            date-time
     */
    public void setInitialPosition(LocalDateTime initialPosition) {
        getElement().setProperty("initialPosition", initialPosition == null
                ? "" : formatPresentationValue(initialPosition));
    }

    /**
     * Gets the initial popup position.
     *
     * @return the initial position, or {@code null} if not set
     */
    public LocalDateTime getInitialPosition() {
        return parsePresentationValue(
                getElement().getProperty("initialPosition", ""));
    }

    /**
     * Sets whether selections in the popup are applied to the value
     * immediately (the default). When set to {@code false}, selections are
     * staged and the popup shows a Cancel/OK action bar; only pressing OK
     * applies the staged selection, while Cancel, Escape or closing the
     * popup discards it.
     *
     * @param autoApply
     *            {@code true} to apply selections immediately
     */
    public void setAutoApply(boolean autoApply) {
        getElement().setProperty("autoApply", autoApply);
    }

    /**
     * Gets whether selections are applied immediately.
     *
     * @return {@code true} if selections are applied immediately
     */
    public boolean isAutoApply() {
        return getElement().getProperty("autoApply", true);
    }

    /**
     * Sets whether ISO-8601 week numbers are shown in the calendar. Only
     * supported when the first day of the week is Monday
     * ({@code i18n.firstDayOfWeek} = 1).
     *
     * @param showWeekNumbers
     *            {@code true} to show week numbers
     */
    public void setShowWeekNumbers(boolean showWeekNumbers) {
        getElement().setProperty("showWeekNumbers", showWeekNumbers);
    }

    /**
     * Gets whether week numbers are shown.
     *
     * @return {@code true} if week numbers are shown
     */
    public boolean isShowWeekNumbers() {
        return getElement().getProperty("showWeekNumbers", false);
    }

    @Override
    public void setErrorMessage(String errorMessage) {
        getElement().setProperty("errorMessage",
                errorMessage == null ? "" : errorMessage);
    }

    @Override
    public String getErrorMessage() {
        return getElement().getProperty("errorMessage", "");
    }

    @Override
    public void setInvalid(boolean invalid) {
        getElement().setProperty("invalid", invalid);
    }

    @Override
    public boolean isInvalid() {
        return getElement().getProperty("invalid", false);
    }

    /**
     * Sets the internationalization settings.
     *
     * @param i18n
     *            the i18n object, not {@code null}
     */
    public void setI18n(DateTimeComboPickerI18n i18n) {
        this.i18n = i18n;
        getElement().setPropertyJson("i18n", toJson(i18n));
    }

    /**
     * Gets the internationalization settings.
     *
     * <p>
     * Note: updating the returned object does not update the component; call
     * {@link #setI18n(DateTimeComboPickerI18n)} to apply changes.
     *
     * @return the i18n object, or {@code null} if not set
     */
    public DateTimeComboPickerI18n getI18n() {
        return i18n;
    }

    private static JsonObject toJson(DateTimeComboPickerI18n i18n) {
        JsonObject json = Json.createObject();
        putStringArray(json, "monthNames", i18n.getMonthNames());
        putStringArray(json, "weekdays", i18n.getWeekdays());
        putStringArray(json, "weekdaysShort", i18n.getWeekdaysShort());
        json.put("firstDayOfWeek", i18n.getFirstDayOfWeek());
        putString(json, "today", i18n.getToday());
        putString(json, "year", i18n.getYear());
        putString(json, "ok", i18n.getOk());
        putString(json, "cancel", i18n.getCancel());
        putString(json, "prevMonth", i18n.getPrevMonth());
        putString(json, "nextMonth", i18n.getNextMonth());
        putString(json, "hours", i18n.getHours());
        putString(json, "minutes", i18n.getMinutes());
        putString(json, "seconds", i18n.getSeconds());
        putString(json, "meridiem", i18n.getMeridiem());
        putString(json, "am", i18n.getAm());
        putString(json, "pm", i18n.getPm());
        return json;
    }

    private static void putString(JsonObject json, String key, String value) {
        if (value != null) {
            json.put(key, value);
        }
    }

    private static void putStringArray(JsonObject json, String key,
            List<String> values) {
        if (values != null) {
            JsonArray array = Json.createArray();
            for (int i = 0; i < values.size(); i++) {
                array.set(i, values.get(i));
            }
            json.put(key, array);
        }
    }
}
