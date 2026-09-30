/**
 * Econva — Section Label
 *
 * Micro section label with a short accent rule. Used by all three screens to
 * place the reader inside the journey: presentation → acesso → cadastro.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import {
  appColors,
  appRadius,
  appSpace,
  appType,
} from '../../theme/app';

type SectionLabelProps = {
  children: string;
  tone?: 'muted' | 'accent';
  style?: ViewStyle;
};

export function SectionLabel({
  children,
  tone = 'muted',
  style,
}: SectionLabelProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.rule, tone === 'accent' && styles.ruleAccent]} />
      <Text
        style={[
          styles.text,
          tone === 'accent' ? styles.textAccent : styles.textMuted,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.sm,
  },

  rule: {
    width: 18,
    height: 2,
    borderRadius: appRadius.full,
    backgroundColor: appColors.borderStrong,
  },

  ruleAccent: {
    backgroundColor: appColors.accent,
  },

  text: {
    ...appType.micro,
    textTransform: 'uppercase',
  },

  textMuted: {
    color: appColors.textTertiary,
  },

  textAccent: {
    color: appColors.accentBright,
  },
});
