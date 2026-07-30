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
    void valueChangeListener_firesOnServerSideChange() {
        DateTimeComboPicker picker = new DateTimeComboPicker();
        LocalDateTime[] observed = new LocalDateTime[1];
        picker.addValueChangeListener(e -> observed[0] = e.getValue());
        LocalDateTime value = LocalDateTime.of(2026, 7, 30, 13, 5);
        picker.setValue(value);
        assertEquals(value, observed[0]);
    }
}
