// src/utils/dateUtils.js

/**
 * Convert any date to CST display format
 * @param {string|Date} dateInput - The date to format
 * @returns {string} Formatted date (MM/DD/YYYY)
 */
export function formatToCST(dateInput) {
  if (!dateInput) return "N/A";
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  
  // Convert to CST and format as MM/DD/YYYY
  return date.toLocaleDateString('en-US', { 
    timeZone: 'America/Chicago'
  });
}

/**
 * Convert to CST with time (HH:MM AM/PM)
 */
export function formatDateTimeToCST(dateInput) {
  if (!dateInput) return "N/A";
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  
  return date.toLocaleString('en-US', { 
    timeZone: 'America/Chicago',
    dateStyle: 'short',
    timeStyle: 'short'
  });
}