/**
 * Econva — App Theme
 *
 * The authenticated application expression of the design foundation.
 *
 * Same canvas, same accent, same type scale, same hairlines as authentication
 * — interpreted for dense financial data. The rules that matter:
 *
 *   · Depth comes from light and surface contrast, not drop shadows
 *   · Money has the strongest type on the screen and tabular figures
 *   · Semantic colour is reserved for direction (positive / negative) only
 *   · Cards group meaning, never decoration
 */

import {
  foundationColors,
  foundationGradients,
  foundationGradientsDirections,
  foundationMotion,
  foundationMotionScale,
  foundationRadius,
  foundationShadows,
  foundationSizing,
  foundationSpace,
  foundationType,
} from './foundation';
import { appLayout } from './appLayout';

/** The app and the auth screens share one atmospheric layer. */
export type AppBackdropVariant =
  | 'immersive'
  | 'focused'
  | 'structured'
  | 'app';

export const appMotion = foundationMotion;
export const appMotionScale = foundationMotionScale;
export const appGradients = foundationGradients;
export const appGradientsDirections = foundationGradientsDirections;
export const appRadius = foundationRadius;
export const appShadows = foundationShadows;
export const appSizing = foundationSizing;
export const appSpace = foundationSpace;
export { appLayout };

export const appColors = {
  // Canvas
  canvas: foundationColors.canvas,
  canvasElevated: foundationColors.canvasElevated,

  /** Dim behind a modal layer — alerts and any future sheet. */
  scrim: foundationColors.scrim,

  // Surfaces
  surface: foundationColors.surface,
  surfaceStrong: foundationColors.surfaceStrong,
  surfaceSunken: foundationColors.surfaceSunken,

  // Text
  textPrimary: foundationColors.textPrimary,
  textSecondary: foundationColors.textSecondary,
  textTertiary: foundationColors.textTertiary,
  textOnAccent: foundationColors.textOnAccent,

  // Accent
  accent: foundationColors.accent,
  accentBright: foundationColors.accentBright,
  accentDeep: foundationColors.accentDeep,
  accentWash: foundationColors.accentWash,
  accentGlow: foundationColors.accentGlow,

  // Hairlines
  border: foundationColors.border,
  borderStrong: foundationColors.borderStrong,
  borderFocused: foundationColors.borderFocused,
  borderAccent: foundationColors.borderAccent,
  borderAccentStrong: foundationColors.borderAccentStrong,
  highlight: foundationColors.highlight,

  // Financial direction — the only semantic colour allowed to lead
  income: foundationColors.success,
  incomeSubtle: 'rgba(52, 211, 153, 0.12)',
  expense: foundationColors.error,
  expenseSubtle: 'rgba(248, 113, 113, 0.12)',
  warning: '#FBBF24',
  warningSubtle: 'rgba(251, 191, 36, 0.12)',
  neutral: foundationColors.textTertiary,
  neutralSubtle: 'rgba(255, 255, 255, 0.05)',

  /** Input and status errors. Aliased to the expense hue on purpose. */
  error: foundationColors.error,
  errorSubtle: 'rgba(248, 113, 113, 0.12)',

  /** Positive confirmations. */
  success: foundationColors.success,
  successSubtle: 'rgba(52, 211, 153, 0.12)',

  /** Status bar and system surfaces while a screen is mounted. */
  system: foundationColors.canvas,
} as const;

export const appType = {
  /** The Welcome headline. The largest role in the system. */
  hero: foundationType.hero,

  /** Screen title. Matches the authentication headline, one step down. */
  screenTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },

  /** Section title inside a screen. */
  section: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },

  /** The single most important number on a screen. */
  value: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800' as const,
    letterSpacing: -1.3,
  },

  /** Secondary money: goal totals, account balances. */
  valueLarge: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },

  /**
   * Figures inside a two-up stat tile. Half the screen is narrow, so this role
   * is sized to stay on one line on a small phone without auto-shrinking.
   */
  statValue: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },

  /** Money inside lists and rows. */
  amount: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },

  /** Money at the centre of a detail screen. */
  amountHero: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
  },

  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },

  bodySmall: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
  },

  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
  },

  bodySemibold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },

  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },

  caption: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
  },

  captionStrong: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600' as const,
  },

  /** Metadata: dates, categories, helper text. */
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },

  /** Section eyebrows, counters, status labels. */
  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },

  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },

  /** The Econva logotype — the foundation's wordmark role, unchanged. */
  wordmark: foundationType.wordmark,
} as const;

/** Variants whose figures should use tabular numerals. */
export const tabularVariants = [
  'value',
  'valueLarge',
  'statValue',
  'amount',
  'amountHero',
] as const;

export type AppTypeVariant = keyof typeof appType;
