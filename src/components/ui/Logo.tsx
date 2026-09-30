/**
 * Logo — the brand mark, plus the Econva wordmark.
 *
 * The mark ships as its own square artwork (assets/logo-mark.png, 400 × 400):
 * a single colour on transparency. The frame and the artwork are the same box,
 * so there is no crop math to keep in step with an asset, and nothing to clip —
 * the shapes carry their own rounding, which is why the frame no longer applies
 * a `borderRadius` of its own. Being a one-colour silhouette, the mark takes
 * `tintColor` and lands on the accent token by default: the artwork ships at
 * the brand board's deeper purple, which reads muddy against a near-black
 * canvas, and a token default keeps the mark in step with every other accent
 * in the product with no second asset to maintain.
 *
 * The wordmark is set as type — `appType.wordmark` — instead of being cropped
 * out of a stacked lockup image. Type is sharp at every size, needs no second
 * asset to recolour, and cannot fall behind the name: an image of the wordmark
 * is a liability the moment the wordmark changes.
 *
 * `width` is the width the wordmark is drawn *for*, not a clipping frame. The
 * box keeps the lockup's established height so the rows around it do not move,
 * while the type inside hugs its own glyphs — a few pixels either way cannot
 * be seen, but a clipped or ellipsised logo can.
 */

import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { appColors, appShadows, appType } from '../../theme/app';

const MARK = require('../../../assets/logo-mark.png');

const WORDMARK = 'Econva';

/** Reference width `appType.wordmark` is drawn at; other widths scale from it. */
const WORDMARK_REFERENCE_WIDTH = 98;

/**
 * Height of the wordmark box as a fraction of `width`, plus a hair of
 * breathing room. Kept from the artwork this replaces so a lockup that was
 * 98 × 22.6 is still 98 × 22.6 and nothing around it shifts.
 */
const WORDMARK_FRAME_RATIO = 0.3105;
const WORDMARK_FRAME_PADDING = 2;

type LogoVariant = 'mark' | 'wordmark';

type LogoProps = {
  variant?: LogoVariant;
  /** For `mark`: the edge length of the square frame. */
  size?: number;
  /** For `wordmark`: the width the wordmark is drawn for. */
  width?: number;
  /**
   * Overrides the colour. The wordmark is type, so this is its text colour
   * and it falls back to the primary text token — legible on the canvas even
   * if nobody passes one. The mark is a silhouette and falls back to the
   * accent token.
   */
  tint?: string;
  style?: ViewStyle;
  /** Adds a soft accent bloom behind the mark. */
  glow?: boolean;
};

export function Logo({
  variant = 'mark',
  size = 40,
  width = 148,
  tint,
  style,
  glow = false,
}: LogoProps) {
  if (variant === 'wordmark') {
    const scale = width / WORDMARK_REFERENCE_WIDTH;
    const { fontSize, lineHeight, letterSpacing, fontWeight } = appType.wordmark;

    return (
      <View
        style={[
          {
            width,
            height: width * WORDMARK_FRAME_RATIO + WORDMARK_FRAME_PADDING,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            {
              fontSize: fontSize * scale,
              lineHeight: lineHeight * scale,
              letterSpacing: letterSpacing * scale,
              fontWeight,
            },
            tint ? { color: tint } : { color: appColors.textPrimary },
          ]}
        >
          {WORDMARK}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        { width: size, height: size, overflow: 'hidden' },
        glow && styles.glow,
        style,
      ]}
    >
      <Image
        source={MARK}
        style={[styles.image, { tintColor: tint ?? appColors.accent }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },

  glow: {
    ...appShadows.mark,
  },
});
