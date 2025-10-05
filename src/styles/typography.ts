/**
 * Typography constants for the Student Platform
 */

export const Typography = {
  // Font Sizes
  displayTitle: 40,          // Splash Screen app name (text-5xl ~ 40px)
  largeTitle: 24,            // Screen titles (text-2xl ~ 24px)
  mediumTitle: 20,           // Section headers (text-xl ~ 20px)
  bodyText: 16,              // Primary content (text-base ~ 16px)
  smallText: 14,             // Secondary content (text-sm ~ 14px)
  extraSmall: 12,            // Labels, helpers (text-xs ~ 12px)

  // Font Weights
  bold: 'bold',              // Titles and important text (font-bold)
  semiBold: '600',           // Headers and buttons (font-semibold)
  medium: '500',             // Labels (font-medium)
  normal: 'normal',          // Regular content (font-normal)
} as const;

export type TypographyType = keyof typeof Typography;