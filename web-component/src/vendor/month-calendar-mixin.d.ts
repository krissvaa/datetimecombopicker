/**
 * @license
 * Copyright (c) 2016 - 2026 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 *
 * Hand-written declarations for month-calendar-mixin.js (forked from vaadin/web-components v25.2.7). See NOTICE.
 */
import type { Constructor } from '@open-wc/dedupe-mixin';

export declare class MonthCalendarMixinClass {
  month: Date;

  selectedDate: Date | undefined;

  focusedDate: Date | undefined;

  showWeekNumbers: boolean;

  i18n: object;

  ignoreTaps: boolean;

  minDate: Date | null;

  maxDate: Date | null;

  isDateDisabled: (date: { day: number; month: number; year: number }) => boolean;

  enteredDate: Date | undefined;

  readonly disabled: boolean;

  readonly focusableDateElement: HTMLElement | undefined;
}

export declare function MonthCalendarMixin<T extends Constructor<HTMLElement>>(
  base: T,
): Constructor<MonthCalendarMixinClass> & T;
