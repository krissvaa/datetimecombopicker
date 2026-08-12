/**
 * @license
 * Copyright (c) 2016 - 2026 Vaadin Ltd.
 * This program is available under Apache License Version 2.0, available at https://vaadin.com/license/
 *
 * Hand-written declarations for date-picker-helper.js (forked from vaadin/web-components v25.2.7). See NOTICE.
 */

export function getISOWeekNumber(date: Date): number;

export function normalizeDate(date: Date): Date;

export function normalizeUTCDate(date: Date): Date;

export function dateEquals(
  date1: Date | null | undefined,
  date2: Date | null | undefined,
  normalizer?: (date: Date) => Date,
): boolean;

export function extractDateParts(date: Date): { day: number; month: number; year: number };

export function dateAllowed(
  date: Date | null | undefined,
  min?: Date | null,
  max?: Date | null,
  isDateDisabled?: (date: { day: number; month: number; year: number }) => boolean,
): boolean;

export function getClosestDate(date: Date, dates: Date[]): Date;

export function dateAfterXMonths(months: number): Date;

export function getAdjustedYear(referenceDate: Date, year: number, month?: number, day?: number): number;

export function parseDate(str: string): Date | undefined;

export function parseUTCDate(str: string): Date | undefined;

export function formatISODate(date: Date): string;

export function formatUTCISODate(date: Date): string;
