// utils/date.ts - Date Utility Functions

import { format, parseISO, isWithinInterval } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy HH:mm');
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
};

export const getDayOfWeek = (date: Date): string => {
  return format(date, 'EEEE');
};

export const getMonthYear = (date: Date): string => {
  return format(date, 'MMMM yyyy');
};

export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  return isWithinInterval(date, { start: startDate, end: endDate });
};

export const getDaysInRange = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Safely convert a value to a Date object, returning null if invalid
 */
export const safeDate = (date: any): Date | null => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Safely format a date to ISO string (YYYY-MM-DD), returning empty string if invalid
 */
export const safeDateToISOString = (date: any): string => {
  const d = safeDate(date);
  return d ? d.toISOString().split('T')[0] : '';
};

/**
 * Safely get timestamp from a date, returning 0 if invalid
 */
export const safeGetTime = (date: any): number => {
  const d = safeDate(date);
  return d ? d.getTime() : 0;
};
