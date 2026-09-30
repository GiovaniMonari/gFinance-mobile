/**
 * Econva — App Layout
 *
 * Screen-level constants for the authenticated application. The values follow
 * the authentication shell: a 24pt gutter and generous bottom space so the
 * floating tab bar never crowds the last row of content.
 */

export const appLayout = {
  /** Horizontal gutter, shared by every authenticated screen. */
  gutter: 24,
  /** Space above a screen's first element, below the status bar inset. */
  screenTop: 8,

  /** Header height for stack screens with a back button. */
  headerHeight: 60,
  headerPaddingHorizontal: 16,

  /** The floating tab bar: height, insets and the space it occupies. */
  tabBarHeight: 60,
  tabBarRadius: 24,
  tabBarMargin: 16,
  /**
   * Minimum content clearance below the last row on a tab screen. The real
   * value is computed from the safe-area inset at runtime; this is the floor
   * used when there is no inset.
   */
  tabBarClearance: 76,

  /** Bottom clearance for stack screens above the home indicator. */
  stackBottom: 40,

  /** Content is capped on tablets and large phones. */
  contentMaxWidth: 560,
} as const;

export type AppLayoutKey = keyof typeof appLayout;
