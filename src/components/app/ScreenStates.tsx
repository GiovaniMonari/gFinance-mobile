/**
 * Econva — Screen States
 *
 * Empty, error and loading presentations for the authenticated app. They use
 * the same canvas, accent and type scale as everything else, so a screen that
 * has no data still looks like part of the product rather than a fallback.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { appColors, appRadius, appSpace } from '../../theme/app';
import { Button } from '../ui';
import { AppText } from './AppText';
import { useReveal } from './motion';

// ---------------------------------------------------------------- Empty ----

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}: EmptyStateProps) {
  // An empty list resolves in place, so it arrives rather than appearing.
  const { style: entrance } = useReveal({ distance: 8, from: 0.98 });

  return (
    <Animated.View style={[styles.state, entrance, style]}>
      <View style={styles.stateIcon}>
        <Ionicons name={icon} size={26} color={appColors.accentBright} />
      </View>

      <AppText variant="section" tone="primary" style={styles.stateTitle}>
        {title}
      </AppText>

      {description ? (
        <AppText variant="bodySmall" tone="secondary" style={styles.stateText}>
          {description}
        </AppText>
      ) : null}

      {actionLabel && onActionPress ? (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          size="md"
          fullWidth={false}
          style={styles.stateAction}
        />
      ) : null}
    </Animated.View>
  );
}

// ---------------------------------------------------------------- Error ----

type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: ViewStyle;
};

export function ErrorState({
  title = 'Não foi possível carregar',
  description = 'Verifique sua conexão e tente novamente.',
  retryLabel = 'Tentar novamente',
  onRetry,
  style,
}: ErrorStateProps) {
  const { style: entrance } = useReveal({ distance: 8, from: 0.98 });

  return (
    <Animated.View style={[styles.state, entrance, style]}>
      <View style={[styles.stateIcon, styles.stateIconError]}>
        <Ionicons name="alert-circle-outline" size={26} color={appColors.expense} />
      </View>

      <AppText variant="section" tone="primary" style={styles.stateTitle}>
        {title}
      </AppText>

      <AppText variant="bodySmall" tone="secondary" style={styles.stateText}>
        {description}
      </AppText>

      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="secondary"
          size="md"
          fullWidth={false}
          style={styles.stateAction}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    paddingVertical: appSpace.huge,
    paddingHorizontal: appSpace.xxl,
  },

  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: appRadius.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.accentWash,
    borderWidth: 1,
    borderColor: appColors.borderAccent,
    marginBottom: appSpace.lg,
  },

  stateIconError: {
    backgroundColor: appColors.expenseSubtle,
    borderColor: 'rgba(248, 113, 113, 0.22)',
  },

  stateTitle: {
    textAlign: 'center',
    marginBottom: appSpace.xs,
  },

  stateText: {
    textAlign: 'center',
    maxWidth: 300,
  },

  stateAction: {
    marginTop: appSpace.xl,
    alignSelf: 'center',
  },
});
