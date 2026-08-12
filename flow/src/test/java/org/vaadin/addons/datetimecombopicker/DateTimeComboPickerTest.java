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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;

class DateTimeComboPickerTest {

    @Test
    void initialValueIsNull() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertNull(picker.getValue());
        assertTrue(picker.isEmpty());
    }

    @Test
    void setValue_propertyIsIsoString() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setValue(LocalDateTime.of(2026, 7, 30, 13, 5, 42));
        assertEquals("2026-07-30T13:05:42",
                picker.getElement().getProperty("value"));
    }

    @Test
    void setValue_truncatesToSeconds() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setValue(LocalDateTime.of(2026, 7, 30, 13, 5, 42, 999_000_000));
        assertEquals(LocalDateTime.of(2026, 7, 30, 13, 5, 42),
                picker.getValue());
    }

    @Test
    void setValue_null_clearsProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setValue(LocalDateTime.of(2026, 7, 30, 13, 5));
        picker.setValue(null);
        assertNull(picker.getValue());
        assertEquals("", picker.getElement().getProperty("value"));
    }

    @Test
    void propertyValueWithoutSeconds_parses() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.getElement().setProperty("value", "2026-07-30T13:05");
        assertEquals(LocalDateTime.of(2026, 7, 30, 13, 5), picker.getValue());
    }

    @Test
    void format_defaultAndCustom() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertEquals(DateTimeComboPicker.DEFAULT_FORMAT, picker.getFormat());
        picker.setFormat("M/d/yyyy h:mm a");
        assertEquals("M/d/yyyy h:mm a", picker.getFormat());
        picker.setFormat(null);
        assertEquals(DateTimeComboPicker.DEFAULT_FORMAT, picker.getFormat());
    }

    @Test
    void minMax_roundTrip() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertNull(picker.getMin());
        assertNull(picker.getMax());

        LocalDateTime min = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime max = LocalDateTime.of(2026, 12, 31, 23, 59);
        picker.setMin(min);
        picker.setMax(max);
        assertEquals(min, picker.getMin());
        assertEquals(max, picker.getMax());

        picker.setMin(null);
        assertNull(picker.getMin());
    }

    @Test
    void autoOpen_mapsToInvertedProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertTrue(picker.isAutoOpen());
        picker.setAutoOpen(false);
        assertFalse(picker.isAutoOpen());
        assertTrue(picker.getElement().getProperty("autoOpenDisabled", false));
    }

    @Test
    void clearButtonVisible() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertFalse(picker.isClearButtonVisible());
        picker.setClearButtonVisible(true);
        assertTrue(picker.isClearButtonVisible());
    }

    @Test
    void labelConstructor() {
        DateTimeComboPicker picker = new DateTimeComboPicker("My label");
        assertEquals("My label", picker.getLabel());
    }

    @Test
    void labelAndValueConstructor() {
        LocalDateTime value = LocalDateTime.of(2026, 7, 30, 13, 5);
        DateTimeComboPicker picker = new DateTimeComboPicker("My label",
                value);
        assertEquals(value, picker.getValue());
    }

    @Test
    void errorMessageAndInvalid() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setErrorMessage("Bad value");
        assertEquals("Bad value", picker.getErrorMessage());
        picker.setInvalid(true);
        assertTrue(picker.isInvalid());
    }

    @Test
    void i18n_serializedToProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        DateTimeComboPickerI18n i18n = new DateTimeComboPickerI18n()
                .setMonthNames(List.of("a", "b", "c", "d", "e", "f", "g", "h",
                        "i", "j", "k", "l"))
                .setFirstDayOfWeek(1).setToday("Tänään");
        picker.setI18n(i18n);
        assertEquals(i18n, picker.getI18n());
        String json = picker.getElement().getPropertyRaw("i18n").toString();
        assertTrue(json.contains("Tänään"));
        assertTrue(json.contains("firstDayOfWeek"));
    }

    @Test
    void timeSteps_roundTripAndValidation() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertEquals(1, picker.getHourStep());
        assertEquals(1, picker.getMinuteStep());
        assertEquals(1, picker.getSecondStep());

        picker.setHourStep(6);
        picker.setMinuteStep(5);
        picker.setSecondStep(30);
        assertEquals(6, picker.getHourStep());
        assertEquals(5, picker.getMinuteStep());
        assertEquals(30, picker.getSecondStep());

        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class, () -> picker.setMinuteStep(0));
    }

    @Test
    void initialPosition_roundTrip() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertNull(picker.getInitialPosition());
        LocalDateTime position = LocalDateTime.of(2030, 1, 15, 12, 30);
        picker.setInitialPosition(position);
        assertEquals(position, picker.getInitialPosition());
        picker.setInitialPosition(null);
        assertNull(picker.getInitialPosition());
    }

    @Test
    void autoApply_disabledByDefault_roundTrip() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertFalse(picker.isAutoApply());
        picker.setAutoApply(true);
        assertTrue(picker.isAutoApply());
        assertTrue(picker.getElement().getProperty("autoApply", false));
    }

    @Test
    void closeOnComplete_disabledByDefault_mapsToProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertFalse(picker.isCloseOnComplete());
        picker.setCloseOnComplete(true);
        assertTrue(picker.isCloseOnComplete());
        assertTrue(picker.getElement().getProperty("closeOnComplete", false));
    }

    @Test
    void actionBarButtons_visibleByDefault_mapToInvertedProperties() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertTrue(picker.isOkButtonVisible());
        assertTrue(picker.isCancelButtonVisible());
        picker.setOkButtonVisible(false);
        picker.setCancelButtonVisible(false);
        assertFalse(picker.isOkButtonVisible());
        assertFalse(picker.isCancelButtonVisible());
        assertTrue(picker.getElement().getProperty("okButtonHidden", false));
        assertTrue(picker.getElement().getProperty("cancelButtonHidden",
                false));
    }

    @Test
    void addToActionBar_slotsAndRemoves() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        var button = new com.vaadin.flow.component.html.NativeButton("Now");
        picker.addToActionBar(button);
        assertEquals("action-bar",
                button.getElement().getAttribute("slot"));
        assertEquals(picker.getElement(),
                button.getElement().getParent());
        picker.removeFromActionBar(button);
        org.junit.jupiter.api.Assertions
                .assertNull(button.getElement().getParent());
    }

    @Test
    void i18n_actionBarLabelsSerialized() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setI18n(new DateTimeComboPickerI18n().setOk("Apply")
                .setCancel("Peruuta").setYear("Vuosi"));
        String json = picker.getElement().getPropertyRaw("i18n").toString();
        assertTrue(json.contains("Apply"));
        assertTrue(json.contains("Peruuta"));
        assertTrue(json.contains("Vuosi"));
    }

    @Test
    void timeView_roundTrip() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertEquals(TimeView.COLUMNS, picker.getTimeView());
        picker.setTimeView(TimeView.CLOCK);
        assertEquals(TimeView.CLOCK, picker.getTimeView());
        assertEquals("clock", picker.getElement().getProperty("timeView"));
        org.junit.jupiter.api.Assertions.assertThrows(
                NullPointerException.class, () -> picker.setTimeView(null));
    }

    @Test
    void autoAdvance_enabledByDefault_mapsToInvertedProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertTrue(picker.isAutoAdvance());
        picker.setAutoAdvance(false);
        assertFalse(picker.isAutoAdvance());
        assertTrue(picker.getElement().getProperty("autoAdvanceDisabled",
                false));
    }

    @Test
    void mobileTabs_enabledByDefault_mapsToInvertedProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertTrue(picker.isMobileTabs());
        picker.setMobileTabs(false);
        assertFalse(picker.isMobileTabs());
        assertTrue(picker.getElement().getProperty("mobileTabsDisabled",
                false));
    }

    @Test
    void autoAdvanceDelay_defaults300_rejectsNegative() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        assertEquals(300, picker.getAutoAdvanceDelay());
        picker.setAutoAdvanceDelay(0);
        assertEquals(0, picker.getAutoAdvanceDelay());
        assertEquals(0,
                picker.getElement().getProperty("autoAdvanceDelay", -1));
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> picker.setAutoAdvanceDelay(-1));
    }

    @Test
    void serverSideValidation_marksOutOfRangeValueInvalid() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
        picker.setMax(LocalDateTime.of(2026, 12, 31, 23, 59));

        picker.setValue(LocalDateTime.of(2025, 6, 15, 10, 0));
        assertTrue(picker.isInvalid());

        picker.setValue(LocalDateTime.of(2026, 6, 15, 10, 0));
        assertFalse(picker.isInvalid());

        picker.setValue(LocalDateTime.of(2027, 6, 15, 10, 0));
        assertTrue(picker.isInvalid());
    }

    @Test
    void serverSideValidation_runsWhenMinMaxChange() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setValue(LocalDateTime.of(2026, 6, 15, 10, 0));
        assertFalse(picker.isInvalid());

        picker.setMin(LocalDateTime.of(2026, 7, 1, 0, 0));
        assertTrue(picker.isInvalid());

        picker.setMin(null);
        assertFalse(picker.isInvalid());
    }

    @Test
    void serverSideValidation_neverWritesErrorMessage() {
        // Message selection is owned by the client-side validation; the
        // server writing errorMessage would corrupt the client's fallback
        // tracking of the user-set generic message.
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setErrorMessage("Generic");
        picker.setI18n(new DateTimeComboPickerI18n()
                .setMinErrorMessage("Too early"));
        picker.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));

        picker.setValue(LocalDateTime.of(2025, 6, 15, 10, 0));
        assertTrue(picker.isInvalid());
        assertEquals("Generic", picker.getErrorMessage());
    }

    @Test
    void serverSideValidation_skippedInManualMode() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setManualValidation(true);
        picker.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
        picker.setValue(LocalDateTime.of(2025, 6, 15, 10, 0));
        assertFalse(picker.isInvalid());
    }

    @Test
    void serverSideValidation_leavesNullValueAlone() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
        // Simulate the client marking bad input invalid
        picker.setInvalid(true);
        picker.setValue(null);
        assertTrue(picker.isInvalid(),
                "clearing the value must not clear client-owned invalid state");
    }

    @Test
    void i18n_errorMessagesSerialized() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setI18n(new DateTimeComboPickerI18n()
                .setBadInputErrorMessage("Cannot parse")
                .setRequiredErrorMessage("Fill me in")
                .setDateDisabledErrorMessage("Day off"));
        String json = picker.getElement().getPropertyRaw("i18n").toString();
        assertTrue(json.contains("Cannot parse"));
        assertTrue(json.contains("Fill me in"));
        assertTrue(json.contains("Day off"));
    }

    @Test
    void serverSideValidation_rangeInvalidClearsWhenValueCleared() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
        picker.setValue(LocalDateTime.of(2025, 6, 15, 10, 0));
        assertTrue(picker.isInvalid());
        picker.setValue(null);
        assertFalse(picker.isInvalid(),
                "range invalidity must clear when the value is cleared");
    }

    @Test
    void setValue_nanoDifferenceDoesNotFireValueChange() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        LocalDateTime base = LocalDateTime.of(2026, 7, 30, 13, 5, 42);
        picker.setValue(base);
        int[] events = new int[1];
        picker.addValueChangeListener(e -> events[0]++);
        picker.setValue(base.plusNanos(1));
        assertEquals(0, events[0],
                "a value differing only in nanos must not fire a change");
        assertEquals(base, picker.getValue());
    }

    @Test
    void hasValidValue_rejectsMalformedClientProperty() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        picker.getElement().setProperty("value", "garbage");
        // The malformed value must be rejected, not throw during sync
        assertFalse(pickerHasValidValue(picker));
    }

    private static boolean pickerHasValidValue(DateTimeComboPicker picker) {
        try {
            java.lang.reflect.Method method = DateTimeComboPicker.class
                    .getDeclaredMethod("hasValidValue");
            method.setAccessible(true);
            return (boolean) method.invoke(picker);
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(e);
        }
    }

    @Test
    void setI18n_null_throwsWithMessage() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        NullPointerException npe = org.junit.jupiter.api.Assertions
                .assertThrows(NullPointerException.class,
                        () -> picker.setI18n(null));
        assertTrue(npe.getMessage().contains("i18n"));
    }

    @Test
    void setI18n_nullListElement_failsFast() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        // e.g. an incomplete translation bundle looked up with Map::get;
        // must fail here instead of rendering "undefined" client-side
        DateTimeComboPickerI18n i18n = new DateTimeComboPickerI18n()
                .setMonthNames(java.util.Arrays.asList("a", null, "c", "d",
                        "e", "f", "g", "h", "i", "j", "k", "l"));
        NullPointerException npe = org.junit.jupiter.api.Assertions
                .assertThrows(NullPointerException.class,
                        () -> picker.setI18n(i18n));
        assertTrue(npe.getMessage().contains("monthNames"));
    }

    @Test
    void valueChangeListener_firesOnServerSideChange() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        LocalDateTime[] observed = new LocalDateTime[1];
        picker.addValueChangeListener(e -> observed[0] = e.getValue());
        LocalDateTime value = LocalDateTime.of(2026, 7, 30, 13, 5);
        picker.setValue(value);
        assertEquals(value, observed[0]);
    }
}
