/**
 * @license
 * Copyright (c) 2026 DateTimeComboPicker contributors.
 * This program is available under Apache License Version 2.0.
 *
 * Backwards-compatible entrypoint. Since the Vaadin 25 port the component
 * ships complete base styles (no separate Lumo module): the visual accent
 * follows the application theme via the `--vaadin-*` design tokens, so
 * this module is identical to importing `date-time-combo-picker.js`.
 */
import './date-time-combo-picker.js';

export * from './date-time-combo-picker.js';
