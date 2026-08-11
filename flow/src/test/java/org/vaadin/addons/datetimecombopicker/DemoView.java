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
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
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

        add(new H1("DateTimeComboPicker demo"));

        // -------------------------------------------------- Theme switcher
        // Vaadin 25 themes are plain stylesheets, swappable at runtime. The
        // CSS files are copied into src/main/webapp/demo-themes by the build.
        Select<String> theme = new Select<>();
        theme.setLabel("Theme");
        theme.setItems("Base", "Lumo", "Aura");
        theme.setValue("Base");
        Checkbox dark = new Checkbox("Dark");
        theme.addValueChangeListener(e -> applyTheme(theme, dark));
        dark.addValueChangeListener(e -> applyTheme(theme, dark));
        HorizontalLayout themeBar = new HorizontalLayout(theme, dark);
        themeBar.setDefaultVerticalComponentAlignment(
                FlexComponent.Alignment.BASELINE);
        themeBar.setWidthFull();
        themeBar.setJustifyContentMode(
                FlexComponent.JustifyContentMode.END);
        add(themeBar);

        // ------------------------------------------------ Format-driven UI
        add(new H2("Format-driven fields"));

        DateTimeComboPicker basic = new DateTimeComboPicker(
                "Default (dd.MM.yyyy HH:mm)");
        basic.setClearButtonVisible(true);
        addWithValueOutput(basic);

        DateTimeComboPicker seconds = new DateTimeComboPicker(
                "With seconds (dd.MM.yyyy HH:mm:ss)");
        seconds.setFormat("dd.MM.yyyy HH:mm:ss");
        seconds.setValue(LocalDateTime.of(2026, 7, 30, 13, 37, 42));
        addWithValueOutput(seconds);

        DateTimeComboPicker twelveHour = new DateTimeComboPicker(
                "US 12h (M/d/yyyy h:mm a)");
        twelveHour.setFormat("M/d/yyyy h:mm a");
        addWithValueOutput(twelveHour);

        DateTimeComboPicker hoursOnly = new DateTimeComboPicker(
                "Hours only (dd.MM.yyyy HH)");
        hoursOnly.setFormat("dd.MM.yyyy HH");
        addWithValueOutput(hoursOnly);

        // ------------------------------------------------------ Time views
        add(new H2("Analog clock (TimeView.CLOCK)"));

        DateTimeComboPicker clock = new DateTimeComboPicker(
                "Analog clock, 24h");
        clock.setTimeView(TimeView.CLOCK);
        addWithValueOutput(clock);

        DateTimeComboPicker clock12 = new DateTimeComboPicker(
                "Analog clock, 12h with seconds (h:mm:ss a)");
        clock12.setTimeView(TimeView.CLOCK);
        clock12.setFormat("M/d/yyyy h:mm:ss a");
        addWithValueOutput(clock12);

        DateTimeComboPicker clockStepped = new DateTimeComboPicker(
                "Analog clock, 5-minute steps");
        clockStepped.setTimeView(TimeView.CLOCK);
        clockStepped.setMinuteStep(5);
        addWithValueOutput(clockStepped);

        DateTimeComboPicker clockManual = new DateTimeComboPicker(
                "Analog clock, no auto-advance");
        clockManual.setTimeView(TimeView.CLOCK);
        clockManual.setAutoAdvance(false);
        addWithValueOutput(clockManual);

        // --------------------------------------------------------- Options
        add(new H2("Options"));

        DateTimeComboPicker stepped = new DateTimeComboPicker(
                "5-minute steps (columns)");
        stepped.setMinuteStep(5);
        addWithValueOutput(stepped);

        DateTimeComboPicker weekdaysOnly = new DateTimeComboPicker(
                "Weekdays only (setDateDisabledFunction)");
        weekdaysOnly.setDateDisabledFunction(
                "(d) => [0, 6].includes(new Date(d.year, d.month, d.day).getDay())");
        weekdaysOnly.setErrorMessage("Weekends are not allowed");
        addWithValueOutput(weekdaysOnly);

        DateTimeComboPicker instant = new DateTimeComboPicker(
                "Instant apply (setAutoApply(true))");
        instant.setAutoApply(true);
        addWithValueOutput(instant);

        DateTimeComboPicker customActions = new DateTimeComboPicker(
                "Custom action-bar button (addToActionBar)");
        var nowButton = new com.vaadin.flow.component.button.Button("Now",
                e -> {
                    customActions.setValue(LocalDateTime.now()
                            .truncatedTo(java.time.temporal.ChronoUnit.MINUTES));
                    customActions.setOpened(false);
                });
        nowButton.addThemeVariants(
                com.vaadin.flow.component.button.ButtonVariant.LUMO_TERTIARY,
                com.vaadin.flow.component.button.ButtonVariant.LUMO_SMALL);
        customActions.addToActionBar(nowButton);
        addWithValueOutput(customActions);

        DateTimeComboPicker positioned = new DateTimeComboPicker(
                "Initial position 2030-01-15 12:30");
        positioned.setInitialPosition(LocalDateTime.of(2030, 1, 15, 12, 30));
        addWithValueOutput(positioned);

        DateTimeComboPicker stacked = new DateTimeComboPicker(
                "Stacked mobile layout (setMobileTabs(false))");
        stacked.setMobileTabs(false);
        addWithValueOutput(stacked);

        DateTimeComboPicker localized = new DateTimeComboPicker(
                "Localized (fi), week numbers, 12h with localized AM/PM");
        localized.setFormat("d.M.yyyy h.mm a");
        localized.setShowWeekNumbers(true);
        localized.setI18n(new DateTimeComboPickerI18n()
                .setMonthNames(List.of("tammikuu", "helmikuu", "maaliskuu",
                        "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu",
                        "syyskuu", "lokakuu", "marraskuu", "joulukuu"))
                .setWeekdays(List.of("sunnuntai", "maanantai", "tiistai",
                        "keskiviikko", "torstai", "perjantai", "lauantai"))
                .setWeekdaysShort(
                        List.of("su", "ma", "ti", "ke", "to", "pe", "la"))
                .setFirstDayOfWeek(1).setToday("Tänään").setYear("Vuosi")
                .setCancel("Peruuta").setAm("ap.").setPm("ip."));
        addWithValueOutput(localized);

        // -------------------------------------------- Validation and Binder
        add(new H2("Validation and Binder"));

        DateTimeComboPicker minMax = new DateTimeComboPicker(
                "Min/max (this year only)");
        minMax.setMin(LocalDateTime.of(2026, 1, 1, 0, 0));
        minMax.setMax(LocalDateTime.of(2026, 12, 31, 23, 59));
        minMax.setErrorMessage("Value must be in 2026");
        // Per-constraint messages override the generic one
        minMax.setI18n(new DateTimeComboPickerI18n()
                .setMinErrorMessage("Too early — must be in 2026")
                .setMaxErrorMessage("Too late — must be in 2026")
                .setBadInputErrorMessage(
                        "Doesn't match the format dd.MM.yyyy HH:mm"));
        addWithValueOutput(minMax);

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
        HorizontalLayout binderRow = new HorizontalLayout(bound, validate);
        // Line the button up with the input box (the field is taller
        // because of its label)
        binderRow.setDefaultVerticalComponentAlignment(
                FlexComponent.Alignment.BASELINE);
        add(binderRow, binderStatus);
    }

    private void applyTheme(Select<String> theme, Checkbox dark) {
        String href = switch (theme.getValue()) {
        case "Lumo" -> "demo-themes/@vaadin/vaadin-lumo-styles/dist/lumo.css";
        case "Aura" -> "demo-themes/@vaadin/aura/aura.css";
        default -> null;
        };
        getElement().executeJs(
                """
                        document.getElementById('demo-theme')?.remove();
                        if ($0) {
                          const link = document.createElement('link');
                          link.id = 'demo-theme';
                          link.rel = 'stylesheet';
                          link.href = $0;
                          document.head.appendChild(link);
                        }
                        document.documentElement.style.colorScheme = $1 ? 'dark' : '';
                        """,
                href, dark.getValue());
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
