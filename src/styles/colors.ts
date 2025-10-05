/**
 * Color constants for the Student Platform
 */

export const Colors = {
  // Primary Colors
  primaryDark: '#0B2545',      // Primary backgrounds, headers, and accent elements
  secondaryDark: '#1a3a5c',   // Gradients and secondary backgrounds
  gold: '#D4AF37',            // Premium elements, borders, and highlights
  lightGold: '#D4A574',       // Buttons, badges, and interactive elements
  warmGold: '#B8941F',        // Gradients and premium elements
  lightBackground: '#f2eddc', // Selected states and premium backgrounds

  // Secondary Colors
  white: '#FFFFFF',           // Text on dark backgrounds
  
  white70: 'rgba(255, 255, 255, 0.7)', // Text opacity
  lightGray: '#F9FAFB',       // General backgrounds
  silverGray: '#F3F4F6',      // Borders and dividers

  // Status Colors
  green: '#10B981',           // Level 1 (Easy) difficulty
  yellow: '#F59E0B',          // Level 2 (Medium) difficulty
  redOrange: '#F97316',       // Level 3 (Hard) difficulty
};

export type ColorType = keyof typeof Colors;