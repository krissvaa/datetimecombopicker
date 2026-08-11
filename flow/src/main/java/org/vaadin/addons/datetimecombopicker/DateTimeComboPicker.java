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
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import com.vaadin.flow.component.AbstractSinglePropertyField;
import com.vaadin.flow.component.AttachEvent;
import com.vaadin.flow.component.Component;
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

import com.vaadin.flow.internal.JacksonUtils;

import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * A combined date and time picker: a single field with a {@link LocalDateTime}
 * value whose popup shows a month calendar and a time selector side by side
 * (sliding columns by default, or an analog clock via
 * {@link #setTimeView(TimeView)}).
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
    private boolean manualValidation;
    private String dateDisabledFunction;
    private boolean rangeInvalid;

    /**
     * Creates a new picker with no value and the default format
     * ({@value #DEFAULT_FORMAT}).
     */
    public DateTimeComboPicker() {
        super("value", null, String.class,
                DateTimeComboPicker::parsePresentationValue,
                DateTimeComboPicker::formatPresentationValue);
        addValueChangeListener(event -> validate());
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

    /**
     * {@inheritDoc}
     *
     * <p>
     * Rejects client-sent property values that are not parseable ISO-8601
     * local date-times, instead of throwing during request processing.
     */
    @Override
    protected boolean hasValidValue() {
        String value = getElement().getProperty("value", "");
        if (value.isEmpty()) {
            return true;
        }
        try {
            LocalDateTime.parse(value);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    /**
     * {@inheritDoc}
     *
     * <p>
     * The value is truncated to seconds precision, matching what the
     * component can represent and serialize.
     */
    @Override
    public void setValue(LocalDateTime value) {
        // Truncate before the value reaches the field support, so a value
        // differing only in nanos from the current one is not stored as a
        // new (untruncated) model value without a property change.
        super.setValue(
                value == null ? null : value.truncatedTo(ChronoUnit.SECONDS));
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
     * Sets the earliest allowed date-time. Values before it make the field
     * invalid, both client-side and in the server-side validation that runs
     * on every value change.
     *
     * @param min
     *            the minimum value, or {@code null} for no limit
     */
    public void setMin(LocalDateTime min) {
        getElement().setProperty("min",
                min == null ? "" : formatPresentationValue(min));
        validate();
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
     * Sets the latest allowed date-time. Values after it make the field
     * invalid, both client-side and in the server-side validation that runs
     * on every value change.
     *
     * @param max
     *            the maximum value, or {@code null} for no limit
     */
    public void setMax(LocalDateTime max) {
        getElement().setProperty("max",
                max == null ? "" : formatPresentationValue(max));
        validate();
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
     * <p>
     * <b>Security:</b> the expression is injected into the page as
     * JavaScript, equivalent in power to
     * {@code Element.executeJs}. It must be a developer-authored constant —
     * never build it from user or request-derived input, or you create a
     * script-injection (XSS) vulnerability.
     *
     * @param jsFunctionExpression
     *            a JavaScript function expression, or {@code null} to remove
     */
    public void setDateDisabledFunction(String jsFunctionExpression) {
        this.dateDisabledFunction = jsFunctionExpression;
        applyDateDisabledFunction();
    }

    private void applyDateDisabledFunction() {
        if (dateDisabledFunction == null) {
            getElement().executeJs("this.isDateDisabled = undefined;");
        } else {
            getElement().executeJs(
                    "this.isDateDisabled = (" + dateDisabledFunction + ");");
        }
    }

    @Override
    protected void onAttach(AttachEvent attachEvent) {
        super.onAttach(attachEvent);
        // executeJs state does not survive client-side element re-creation
        // (detach/re-attach, @PreserveOnRefresh); re-apply the function
        if (dateDisabledFunction != null) {
            applyDateDisabledFunction();
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
     * immediately. By default this is disabled: selections are staged and
     * the popup shows a Cancel/OK action bar; only pressing OK applies the
     * staged selection, while Cancel, Escape or closing the popup discards
     * it. When enabled, every selection updates the value directly and the
     * action bar is hidden.
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
        return getElement().getProperty("autoApply", false);
    }

    /**
     * Sets whether the popup closes automatically once every part offered
     * by the format — the date and each visible time part — has been picked
     * since the popup opened. Meant for {@linkplain #setAutoApply(boolean)
     * auto-apply} mode, which has no OK button to end the flow; without
     * auto-apply this option has no effect. Disabled by default.
     *
     * @param closeOnComplete
     *            {@code true} to close the popup when the selection is
     *            complete
     */
    public void setCloseOnComplete(boolean closeOnComplete) {
        getElement().setProperty("closeOnComplete", closeOnComplete);
    }

    /**
     * Gets whether the popup closes automatically on a complete selection.
     *
     * @return {@code true} if close-on-complete is enabled
     */
    public boolean isCloseOnComplete() {
        return getElement().getProperty("closeOnComplete", false);
    }

    /**
     * Sets whether the OK button of the action bar is visible. Visible by
     * default. Hiding both default buttons leaves only content added with
     * {@link #addToActionBar(Component...)}.
     *
     * @param okButtonVisible
     *            {@code false} to hide the OK button
     */
    public void setOkButtonVisible(boolean okButtonVisible) {
        getElement().setProperty("okButtonHidden", !okButtonVisible);
    }

    /**
     * Gets whether the OK button of the action bar is visible.
     *
     * @return {@code true} if the OK button is visible
     */
    public boolean isOkButtonVisible() {
        return !getElement().getProperty("okButtonHidden", false);
    }

    /**
     * Sets whether the Cancel button of the action bar is visible. Visible
     * by default.
     *
     * @param cancelButtonVisible
     *            {@code false} to hide the Cancel button
     */
    public void setCancelButtonVisible(boolean cancelButtonVisible) {
        getElement().setProperty("cancelButtonHidden", !cancelButtonVisible);
    }

    /**
     * Gets whether the Cancel button of the action bar is visible.
     *
     * @return {@code true} if the Cancel button is visible
     */
    public boolean isCancelButtonVisible() {
        return !getElement().getProperty("cancelButtonHidden", false);
    }

    /**
     * Adds components to the start of the popup's action bar, before the
     * Cancel/OK buttons (e.g. a "Now" shortcut button). Only visible while
     * the action bar is shown, i.e. when auto-apply is disabled (the
     * default). Remove components with
     * {@link #removeFromActionBar(Component...)}.
     *
     * @param components
     *            the components to add
     */
    public void addToActionBar(Component... components) {
        for (Component component : components) {
            component.getElement().setAttribute("slot", "action-bar");
            getElement().appendChild(component.getElement());
        }
    }

    /**
     * Removes components added with {@link #addToActionBar(Component...)}.
     *
     * @param components
     *            the components to remove
     */
    public void removeFromActionBar(Component... components) {
        for (Component component : components) {
            if ("action-bar"
                    .equals(component.getElement().getAttribute("slot"))
                    && getElement().equals(component.getElement()
                            .getParent())) {
                component.getElement().removeAttribute("slot");
                getElement().removeChild(component.getElement());
            }
        }
    }

    /**
     * Sets the time selector shown in the popup: sliding columns (the
     * default) or an analog clock face.
     *
     * @param timeView
     *            the time view, not {@code null}
     */
    public void setTimeView(TimeView timeView) {
        java.util.Objects.requireNonNull(timeView, "timeView must not be null");
        getElement().setProperty("timeView", timeView.getPropertyValue());
    }

    /**
     * Gets the time selector shown in the popup.
     *
     * @return the time view
     */
    public TimeView getTimeView() {
        return TimeView.fromPropertyValue(
                getElement().getProperty("timeView", "columns"));
    }

    /**
     * Sets whether the analog clock automatically advances to the next view
     * (hours to minutes to seconds) after a selection. Enabled by default.
     * When disabled, the user switches views from the digital readout above
     * the dial. Only applies when the time view is {@link TimeView#CLOCK}.
     *
     * @param autoAdvance
     *            {@code true} to advance automatically
     */
    public void setAutoAdvance(boolean autoAdvance) {
        getElement().setProperty("autoAdvanceDisabled", !autoAdvance);
    }

    /**
     * Gets whether the analog clock advances to the next view automatically.
     *
     * @return {@code true} if auto-advance is enabled
     */
    public boolean isAutoAdvance() {
        return !getElement().getProperty("autoAdvanceDisabled", false);
    }

    /**
     * Sets the delay, in milliseconds, before the analog clock advances to
     * the next view after a selection, giving the selection time to register
     * visually. The default is 300 ms; {@code 0} advances immediately. Only
     * applies when the time view is {@link TimeView#CLOCK} and auto-advance
     * is enabled.
     *
     * @param autoAdvanceDelayMs
     *            the delay in milliseconds, not negative
     */
    public void setAutoAdvanceDelay(int autoAdvanceDelayMs) {
        if (autoAdvanceDelayMs < 0) {
            throw new IllegalArgumentException(
                    "autoAdvanceDelayMs must not be negative");
        }
        getElement().setProperty("autoAdvanceDelay", autoAdvanceDelayMs);
    }

    /**
     * Gets the delay before the analog clock advances to the next view.
     *
     * @return the delay in milliseconds
     */
    public int getAutoAdvanceDelay() {
        return getElement().getProperty("autoAdvanceDelay", 300);
    }

    /**
     * Sets whether the fullscreen (mobile) popup shows Date/Time tabs — one
     * section at a time, with the value formatted in the field's format
     * shown above — instead of stacking the calendar above the time
     * selector. Enabled by default; only applies when the format has both a
     * date and a time part. When disabled, the sections stack vertically.
     * The tab labels can be localized with
     * {@link DateTimeComboPickerI18n#setDateTab(String)} and
     * {@link DateTimeComboPickerI18n#setTimeTab(String)}.
     *
     * @param mobileTabs
     *            {@code true} to use the tabbed fullscreen layout
     */
    public void setMobileTabs(boolean mobileTabs) {
        getElement().setProperty("mobileTabsDisabled", !mobileTabs);
    }

    /**
     * Gets whether the fullscreen (mobile) popup uses the tabbed layout.
     *
     * @return {@code true} if the Date/Time tabs are enabled
     */
    public boolean isMobileTabs() {
        return !getElement().getProperty("mobileTabsDisabled", false);
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

    /**
     * {@inheritDoc}
     *
     * <p>
     * Note: this reflects the server-known invalid state (set by
     * {@link #setInvalid(boolean)} and the built-in server-side min/max
     * validation). Constraints evaluated only in the browser — unparseable
     * typed text, required-but-empty and the date-disabled function — are
     * not reported back to the server and are not visible here.
     */
    @Override
    public boolean isInvalid() {
        return getElement().getProperty("invalid", false);
    }

    @Override
    public void setManualValidation(boolean enabled) {
        this.manualValidation = enabled;
    }

    /**
     * Validates the current value against min/max on the server. Runs
     * automatically on every value change and when min/max change; does
     * nothing when manual validation is enabled (e.g. by {@code Binder}).
     *
     * <p>
     * The server only toggles the invalid state; the error message is always
     * chosen by the client-side validation, which knows the failed
     * constraint and the configured i18n messages. Note that a date-disabled
     * function set with {@link #setDateDisabledFunction(String)} is evaluated
     * only in the browser and is not part of this server-side validation.
     */
    protected void validate() {
        if (manualValidation) {
            return;
        }
        LocalDateTime value = getValue();
        if (value == null) {
            // Required/bad-input handling is owned by the client-side
            // validation; the server cannot distinguish "cleared" from
            // "unparseable text" here. Only undo this validator's own
            // verdict so a previously out-of-range field doesn't stay
            // invalid forever after being cleared.
            if (rangeInvalid) {
                rangeInvalid = false;
                setInvalid(false);
            }
            return;
        }
        LocalDateTime min = getMin();
        LocalDateTime max = getMax();
        boolean outOfRange = (min != null && value.isBefore(min))
                || (max != null && value.isAfter(max));
        rangeInvalid = outOfRange;
        setInvalid(outOfRange);
        // Re-run the client-side validation: it evaluates client-only
        // constraints (e.g. the date-disabled function) and applies the
        // i18n error message matching the failed constraint.
        getElement().executeJs("this.validate && this.validate();");
    }

    /**
     * Sets the internationalization settings.
     *
     * @param i18n
     *            the i18n object, not {@code null}
     */
    public void setI18n(DateTimeComboPickerI18n i18n) {
        Objects.requireNonNull(i18n, "i18n must not be null");
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

    private static ObjectNode toJson(DateTimeComboPickerI18n i18n) {
        ObjectNode json = JacksonUtils.createObjectNode();
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
        putString(json, "badInputErrorMessage",
                i18n.getBadInputErrorMessage());
        putString(json, "requiredErrorMessage",
                i18n.getRequiredErrorMessage());
        putString(json, "minErrorMessage", i18n.getMinErrorMessage());
        putString(json, "maxErrorMessage", i18n.getMaxErrorMessage());
        putString(json, "dateDisabledErrorMessage",
                i18n.getDateDisabledErrorMessage());
        return json;
    }

    private static void putString(ObjectNode json, String key, String value) {
        if (value != null) {
            json.put(key, value);
        }
    }

    private static void putStringArray(ObjectNode json, String key,
            List<String> values) {
        if (values != null) {
            ArrayNode array = JacksonUtils.createArrayNode();
            values.forEach(array::add);
            json.set(key, array);
        }
    }
}
