/**
 * Utility functions for formatting values in South African Rand (ZAR)
 */

export const CURRENCY_SYMBOL = 'R';
export const CURRENCY_CODE = 'ZAR';

/**
 * Format a numeric amount into South African Rand (ZAR)
 * Example: 1428942.5 -> "R 1,428,942.50"
 */
export function formatZAR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'R 0.00';
  }
  const val = Number(amount);
  return `R ${val.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a numeric amount without decimals if it's a whole number, or with 2 decimals
 */
export function formatZARFlexible(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'R 0.00';
  }
  const val = Number(amount);
  return `R ${val.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
