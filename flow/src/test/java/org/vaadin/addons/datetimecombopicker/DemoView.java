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
import java.util.List;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.data.binder.Binder;
import com.vaadin.flow.router.Route;

/**
 * Demo / development view. Run with {@code mvn jetty:run} and open
 * <a href="http://localhost:8080">http://localhost:8080</a>.
 */
@Route("")
public class DemoView extends VerticalLayout {

    public DemoView() {
        setSpacing(true);
        setPadding(true);

        add(new H2("DateTimeComboPicker demo"));

        // Default format
        DateTimeComboPicker basic = new DateTimeComboPicker(
                "Default (dd.MM.yyyy HH:mm)");
        basic.setClearButtonVisible(true);
        addWithValueOutput(basic);

        // Seconds column via format
        DateTimeComboPicker seconds = new DateTimeComboPicker(
                "With seconds (dd.MM.yyyy HH:mm:ss)");
        seconds.setFormat("dd.MM.yyyy HH:mm:ss");
        seconds.setValue(LocalDateTime.of(2026, 7, 30, 13, 37, 42));
        addWithValueOutput(seconds);

        // 12-hour clock with AM/PM column
        DateTimeComboPicker twelveHour = new DateTimeComboPicker(
                "US 12h (M/d/yyyy h:mm a)");
        twelveHour.setFormat("M/d/yyyy h:mm a");
        addWithValueOutput(twelveHour);

        // Hours only
        DateTimeComboPicker hoursOnly = new DateTimeComboPicker(
                "Hours only (dd.MM.yyyy HH)");
        hoursOnly.setFormat("dd.MM.yyyy HH");
        addWithValueOutput(hoursOnly);

        // Time steps
        DateTimeComboPicker stepped = new DateTimeComboPicker(
                "5-minute steps (dd.MM.yyyy HH:mm)");
        stepped.setMinuteStep(5);
        addWithValueOutput(stepped);

        // Disabled dates (weekends)
        DateTimeComboPicker weekdaysOnly = new DateTimeComboPicker(
                "Weekdays only");
        weekdaysOnly.setDateDisabledFunction(
                "(d) => [0, 6].includes(new Date(d.year, d.month, d.day).getDay())");
        weekdaysOnly.setErrorMessage("Weekends are not allowed");
        addWithValueOutput(weekdaysOnly);

        // Action bar (staged selection)
        DateTimeComboPicker staged = new DateTimeComboPicker(
                "With OK/Cancel (autoApply=false)");
        staged.setAutoApply(false);
        addWithValueOutput(staged);

        // Initial position
        DateTimeComboPicker positioned = new DateTimeComboPicker(
                "Initial position 2030-01-15 12:30");
        positioned.setInitialPosition(LocalDateTime.of(2030, 1, 15, 12, 30));
        addWithValueOutput(positioned);

        // Min/max
        DateTimeComboPicker minMax = new DateTimeComboPicker(
                "Min/max (this year only)");
        minMax.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
        minMax.setMax(LocalDateTime.of(2026, 12, 31, 23, 59));
        minMax.setErrorMessage("Value must be in 2026");
        addWithValueOutput(minMax);

        // Localized (Finnish), Monday first, week numbers
        DateTimeComboPicker localized = new DateTimeComboPicker(
                "Localized (fi), week numbers");
        localized.setShowWeekNumbers(true);
        localized.setI18n(new DateTimeComboPickerI18n()
                .setMonthNames(List.of("tammikuu", "helmikuu", "maaliskuu",
                        "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu",
                        "syyskuu", "lokakuu", "marraskuu", "joulukuu"))
                .setWeekdays(List.of("sunnuntai", "maanantai", "tiistai",
                        "keskiviikko", "torstai", "perjantai", "lauantai"))
                .setWeekdaysShort(
                        List.of("su", "ma", "ti", "ke", "to", "pe", "la"))
                .setFirstDayOfWeek(1).setToday("Tänään"));
        addWithValueOutput(localized);

        // Binder with validation
        add(new H2("Binder"));
        DateTimeComboPicker bound = new DateTimeComboPicker("Appointment");
        bound.setRequiredIndicatorVisible(true);
        Binder<Appointment> binder = new Binder<>(Appointment.class);
        binder.forField(bound).asRequired("Pick a date and time")
                .bind(Appointment::getStart, Appointment::setStart);
        Span binderStatus = new Span();
        Button validate = new Button("Validate", e -> {
            Appointment appointment = new Appointment();
            if (binder.writeBeanIfValid(appointment)) {
                binderStatus.setText("Saved: " + appointment.getStart());
            } else {
                binderStatus.setText("Validation failed");
            }
        });
        add(new HorizontalLayout(bound, validate), binderStatus);
    }

    private void addWithValueOutput(DateTimeComboPicker picker) {
        Span output = new Span("value: null");
        output.getStyle().set("font-family", "monospace").set("font-size",
                "0.85em").set("color", "var(--lumo-secondary-text-color)");
        picker.addValueChangeListener(
                e -> output.setText("value: " + e.getValue()));
        add(picker, output);
    }

    public static class Appointment {
        private LocalDateTime start;

        public LocalDateTime getStart() {
            return start;
        }

        public void setStart(LocalDateTime start) {
            this.start = start;
        }
    }
}
