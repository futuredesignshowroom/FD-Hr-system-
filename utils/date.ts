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
