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

/**
 * The time selector shown in the {@link DateTimeComboPicker} popup.
 */
public enum TimeView {

    /**
     * Sliding scrollable columns (hours / minutes / seconds / AM-PM), in the
     * style of a digital clock. The default.
     */
    COLUMNS("columns"),

    /**
     * An analog clock face with one dial per time part and a digital readout
     * for switching between them, in the style of the Material Design
     * (Android) time picker.
     */
    CLOCK("clock");

    private final String propertyValue;

    TimeView(String propertyValue) {
        this.propertyValue = propertyValue;
    }

    String getPropertyValue() {
        return propertyValue;
    }

    static TimeView fromPropertyValue(String propertyValue) {
        return "clock".equals(propertyValue) ? CLOCK : COLUMNS;
    }
}
