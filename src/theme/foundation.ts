/**
 * Econva — Design Foundation
 *
 * The single source of truth for the product's visual DNA.
 *
 * The authentication experience was designed first and defines the identity:
 * a near-black canvas, depth expressed with light rather than shadows, one
 * accent hue, a strict type scale, hairline borders and generous space. Every
 * other surface of the app is built from these primitives, so nothing can
 * drift away from them.
 *
 * Layering:
 *   foundation.ts  raw, shared primitives        ← this file
 *   auth.ts        the authentication expression
 *   app.ts         the authenticated application expression
 */

export const foundationColors = {
  // Canvas
  canvas: '#07080B',
  canvasElevated: '#0C0E14',

  /**
   * The dim laid over the screen while a modal layer is up. Derived from the
   * canvas rather than pure black so the backdrop still reads as the same
   * room instead of a hole cut in it.
   */
  scrim: 'rgba(7, 8, 11, 0.72)',

  // Surfaces — translucent so light from the backdrop reads through the UI
  surface: 'rgba(255, 255, 255, 0.04)',
  surfaceStrong: 'rgba(255, 255, 255, 0.07)',
  surfaceSunken: 'rgba(0, 0, 0, 0.28)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9AA1B2',
  textTertiary: '#5C6373',
  textOnAccent: '#FFFFFF',

  // Accent — a single hue, tuned for legibility on a near-black canvas.
  // Violet sits lower in luminance than a blue at the same lightness, so the
  // ramp runs a few points brighter to hold the same contrast against `canvas`.
  accent: '#9C46F1',
  accentBright: '#AD5CFF',
  accentDeep: '#7325C1',
  accentWash: 'rgba(156, 70, 241, 0.12)',
  accentGlow: 'rgba(156, 70, 241, 0.30)',

  // Hairlines
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  borderFocused: 'rgba(173, 92, 255, 0.85)',
  /** Accent-tinted hairline for a chip sitting on `accentWash`. */
  borderAccent: 'rgba(173, 92, 255, 0.22)',
  /** The same edge where it has to read as selected rather than merely tinted. */
  borderAccentStrong: 'rgba(173, 92, 255, 0.32)',
  highlight: 'rgba(255, 255, 255, 0.22)',

  // Semantic
  error: '#F87171',
  success: '#34D399',
} as const;

export const foundationGradients = {
  /** Primary action — one hue, light to deep, diagonal. */
  accent: [
    foundationColors.accentBright,
    foundationColors.accent,
    foundationColors.accentDeep,
  ] as const,

  /** Top edge sheen on filled controls. */
  sheen: ['rgba(255, 255, 255, 0.26)', 'rgba(255, 255, 255, 0)'] as const,

  /** Content fading into the canvas, used above pinned footers. */
  fadeDown: [
    'rgba(7, 8, 11, 0)',
    'rgba(7, 8, 11, 0.72)',
    foundationColors.canvas,
  ] as const,

  fadeUp: [
    foundationColors.canvas,
    'rgba(7, 8, 11, 0.78)',
    'rgba(7, 8, 11, 0)',
  ] as const,
} as const;

export const foundationGradientsDirections = {
  accent: {
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sheen: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  vertical: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
} satisfies Record<
  string,
  { start: { x: number; y: number }; end: { x: number; y: number } }
>;

export const foundationType = {
  /** Welcome headline. Editorial, dominant, two lines maximum. */
  hero: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800' as const,
    letterSpacing: -1.8,
  },

  /** Screen and section headline. Restrained, one line. */
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
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

  /** Field labels. */
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },

  /** Quiet supporting copy. */
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

  /** Section eyebrows and group headers. */
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

  /**
   * The Econva logotype. Title case and tightened like the display roles,
   * because it is the same kind of thing: a word set large, not copy set to
   * be read in a sentence. Set as type rather than shipped as an image so it
   * stays sharp at every size, takes a colour token, and cannot drift out of
   * step with the name the way a cropped asset can.
   *
   * `Logo` draws it at a reference width of 98 and scales from there, so the
   * numbers below are the wordmark at that width.
   */
  wordmark: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.7,
  },
} as const;

export const foundationSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  enormous: 64,
  giant: 80,
} as const;

export const foundationRadius = {
  sm: 8,
  md: 12,
  /** Fields. Moderate rounding — never a pill. */
  field: 16,
  /** Filled controls. The strongest rounding in the system. */
  control: 20,
  group: 22,
  full: 999,
} as const;

export const foundationSizing = {
  /** Primary actions feel substantial. */
  buttonLg: 58,
  buttonMd: 48,
  field: 58,
  /** Minimum comfortable touch target. */
  tap: 44,
  icon: 20,
  iconSm: 16,
  logoMark: 40,
} as const;

export const foundationMotion = {
  /** Staggered entrance, milliseconds. */
  stagger: 70,
  enter: 520,
  /** Ambient loop for the Welcome artwork. */
  breathe: 5200,
  /** Progress bar fill, milliseconds. */
  progress: 900,
  /** Touch down and release. Fast enough to feel like a direct response. */
  press: 110,
  /** A discrete state swap: focus, selection, a toggle moving. */
  state: 220,
  /** Layout shifts and content swapping in place. */
  layout: 340,
  /** Half a breath cycle, for the loading mark. */
  pulse: 1100,
} as const;

/**
 * How far a pressable compresses, and how far it dims.
 *
 * One place, so every control in the app reacts to a touch with the same
 * weight. Subtle on purpose: the press should be felt rather than seen.
 */
export const foundationMotionScale = {
  /** Rows and full-width cards. */
  row: 0.985,
  /** Buttons and chips. */
  control: 0.97,
  /** Small icon buttons. */
  icon: 0.9,
  dim: 0.72,
} as const;

/** Depth is expressed with light, not with heavy shadows. */
export const foundationShadows = {
  filled: {
    shadowColor: foundationColors.accentDeep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 10,
  },
  mark: {
    shadowColor: foundationColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 26,
    elevation: 12,
  },
  /** Lifts a surface off the canvas without a heavy drop shadow. */
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
