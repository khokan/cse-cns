/**
 * Helper utilities for TanStack Data Table
 * Provides common column formatters and sorting utilities
 */

/**
 * Format a date string to show only the date part (YYYY-MM-DD)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateOnly = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  try {
    let date: Date;
    if (typeof dateString === "string") {
      // Handle various date string formats
      date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If invalid, try parsing as timestamp
        const timestamp = parseInt(dateString, 10);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        } else {
          return String(dateString);
        }
      }
    } else {
      date = dateString;
    }
    
    if (isNaN(date.getTime())) {
      return "—";
    }
    
    // Format as YYYY-MM-DD using local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "—";
  }
};

/**
 * Format a date string to show date and time
 * @param dateString - ISO date string or Date object
 * @returns Formatted datetime string (YYYY-MM-DD HH:MM:SS)
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  try {
    let date: Date;
    if (typeof dateString === "string") {
      date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If invalid, try parsing as timestamp
        const timestamp = parseInt(dateString, 10);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        } else {
          return String(dateString);
        }
      }
    } else {
      date = dateString;
    }
    
    if (isNaN(date.getTime())) {
      return "—";
    }
    
    // Format as YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return "—";
  }
};

/**
 * Format a date string to show only time (HH:MM:SS)
 * @param dateString - ISO date string or Date object
 * @returns Formatted time string (HH:MM:SS)
 */
export const formatTimeOnly = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
};

/**
 * Compare function for sorting date columns
 * Works with ISO date strings
 */
export const dateComparator = (a: string | Date | null | undefined, b: string | Date | null | undefined): number => {
  const dateA = a ? new Date(a).getTime() : 0;
  const dateB = b ? new Date(b).getTime() : 0;
  return dateA - dateB;
};

/**
 * Format currency values
 * @param amount - Number to format
 * @param currency - Currency code (default: "USD")
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined, currency: string = "USD"): string => {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return amount.toString();
  }
};

/**
 * Format percentage values
 * @param value - Number between 0-100
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(decimals)}%`;
};
