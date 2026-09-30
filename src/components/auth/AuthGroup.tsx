/**
 * Econva — Auth Group
 *
 * A titled, hairline-divided section of fields. No card: the group earns its
 * structure from a micro header, a rule and the dividers, so every field
 * still aligns with the heading and the action below it.
 */

import React, { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appColors, appSpace, appType } from '../../theme/app';

type AuthGroupProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  style?: ViewStyle;
};

export function AuthGroup({
  title,
  icon,
  children,
  style,
}: AuthGroupProps) {
  const items = Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        {icon ? (
          <Ionicons
            name={icon}
            size={13}
            color={appColors.textTertiary}
          />
        ) : null}
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rule} />
      </View>

      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.sm,
    marginBottom: appSpace.lg,
  },

  title: {
    ...appType.micro,
    color: appColors.textTertiary,
    textTransform: 'uppercase',
  },

  rule: {
    flex: 1,
    height: 1,
    backgroundColor: appColors.border,
  },

  divider: {
    height: 1,
    backgroundColor: appColors.border,
    marginTop: appSpace.md,
    marginBottom: appSpace.md,
  },
});
