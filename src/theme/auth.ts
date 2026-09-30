/**
 * Econva — Auth Theme
 *
 * The authentication expression of the design foundation: three screens that
 * are three intensities of the same dark surface.
 *
 *   immersive  → Welcome   full-bleed art, editorial type, pinned CTA
 *   focused    → Login     art recedes, form takes the stage
 *   structured → Register  art recedes further, form is grouped
 *
 * Values are re-exported from the foundation, so the authentication screens
 * and the authenticated application can never drift apart.
 */

import {
  foundationColors,
  foundationGradients,
  foundationGradientsDirections,
  foundationMotion,
  foundationRadius,
  foundationShadows,
  foundationSizing,
  foundationSpace,
  foundationType,
} from './foundation';

export type AuthBackdropVariant = 'immersive' | 'focused' | 'structured';

export const authColors = foundationColors;

export const authGradients = foundationGradients;

export const authGradientsDirections = foundationGradientsDirections;

export const authTypography = foundationType;

export const authSpacing = foundationSpace;

export const authRadius = foundationRadius;

export const authSizing = foundationSizing;

export const authMotion = foundationMotion;

export const authShadows = foundationShadows;
