
import React from 'react';

/**
 * Handles keyboard events for input areas where 'Enter' triggers a submission
 * and 'Shift + Enter' allows for a new line.
 */
export const handleShiftEnter = (
  e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  submitFn: () => void
) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitFn();
  }
};
