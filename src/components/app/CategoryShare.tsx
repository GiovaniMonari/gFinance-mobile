/**
 * Econva — Category Share
 *
 * How spending divides between categories, ranked largest first.
 *
 * This replaced the ring. The ring drew exactly one number — the share held
 * by the largest category — inside a circle, which meant a chart library was
 * being asked to say what a bar says without being interpreted, and it failed
 * to render on device twice. Ranking the categories answers that same question
 * and the three that follow it: which categories come next, how far apart they
 * are, and whether spending is concentrated at all or spread thin. A reader
 * can compare two bars; nobody can compare two arc angles.
 *
 * Every bar is `Progress`, the same indicator that drives the goal bars, so it
 * measures its own track instead of guessing at a width, animates on the UI
 * thread and yields to Reduce Motion. Nothing here depends on SVG.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { appColors, appSpace } from '../../theme/app';
import { Progress, ProgressLabel } from '../ui';
import { AppText } from './AppText';

export type CategoryShareRow = {
  /** The category as the reader knows it. */
  name: string;
  /** Absolute amount spent, formatted by the caller. */
  amount: number;
  /** Share of all spending, 0–100. */
  share: number;
};

type CategoryShareProps = {
  rows: CategoryShareRow[];
  /** Formats an amount, so the screen keeps ownership of its currency rules. */
  formatAmount: (value: number) => string;
};

/**
 * Enough to see the shape of spending without turning the dashboard into a
 * report. The remainder is the reader's next question, and it belongs on the
 * transactions screen rather than here.
 */
const MAX_ROWS = 4;

/**
 * A fixed column rather than the natural width of the label. Percentages come
 * in two and three digits, so letting them size themselves would give every
 * bar a different length for the same value.
 */
const SHARE_CELL = 48;

export function CategoryShare({ rows, formatAmount }: CategoryShareProps) {
  return (
    <View style={styles.list}>
      {rows.slice(0, MAX_ROWS).map((row, index) => (
        <View
          key={`${row.name}-${index}`}
          style={[styles.row, index > 0 && styles.rowDivided]}
        >
          <View style={styles.rowTop}>
            <AppText
              variant="bodySemibold"
              tone="primary"
              numberOfLines={1}
              style={styles.name}
            >
              {row.name}
            </AppText>
            <AppText
              variant="amount"
              color={appColors.textSecondary}
              numberOfLines={1}
            >
              {formatAmount(row.amount)}
            </AppText>
          </View>

          <View style={styles.rowBar}>
            {/* The bar takes whatever the percentage column leaves behind. */}
            <View style={styles.barSlot}>
              <Progress value={row.share} size="thin" />
            </View>
            <View style={styles.shareCell}>
              <ProgressLabel value={row.share} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },

  row: {
    width: '100%',
  },

  rowDivided: {
    marginTop: appSpace.md,
    paddingTop: appSpace.md,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.md,
    marginBottom: appSpace.sm,
  },

  name: {
    flex: 1,
    minWidth: 0,
  },

  rowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.sm,
  },

  barSlot: {
    flex: 1,
    minWidth: 0,
  },

  shareCell: {
    width: SHARE_CELL,
    alignItems: 'flex-end',
  },
});
