/**
 * Econva — App Alert
 *
 * Native `Alert.alert` hands the panel to the operating system: white on iOS,
 * grey on Android, in a typeface and a radius this product never uses. So every
 * error in the app broke the dark canvas it appeared on, and the message was
 * usually either a bare "Erro" or a backend sentence the reader could do
 * nothing with.
 *
 * This is the product's dialog instead — one elevated surface, an icon chip
 * that carries the tone, and the app's own buttons. Copy stays with the caller:
 * this component never invents, truncates or rewrites what a screen asked to
 * say, it only presents it in the same language as everything around it.
 *
 *   showAlert({
 *     title: 'Não foi possível carregar',
 *     message: 'Suas movimentações do banco ainda não chegaram.',
 *     tone: 'danger',
 *     actions: [{ label: 'Tentar novamente', onPress: retry }],
 *   })
 *
 * `showAlert` needs no hook, no context and no navigation, so it is safe to
 * call from a catch block or the tail of an async function. Anything raised
 * before the host's first render is picked up by that render instead of being
 * dropped.
 *
 * The entrance is the system's own fade (`animationType="fade"`), which runs on
 * both platforms in both directions. There is deliberately no layout animation
 * inside a Modal here: an entering animation that fails to run would leave the
 * panel stuck at zero opacity, and this is the component that reports failures.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  appColors,
  appRadius,
  appShadows,
  appSpace,
} from '../../theme/app';
import { Button } from '../ui';
import { AppText } from './AppText';

export type AlertTone = 'neutral' | 'success' | 'warning' | 'danger';

export type AlertAction = {
  label: string;
  /**
   * `danger` is for a destructive confirmation only. Anything that is merely
   * informative stays on `secondary` so the hue keeps its meaning.
   */
  style?: 'primary' | 'secondary' | 'danger';
  /** Runs immediately — the panel starts closing as it fires. */
  onPress?: () => void;
};

export type AlertOptions = {
  title: string;
  message?: string;
  tone?: AlertTone;
  /** Overrides the tone's icon when the tone alone is not specific enough. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Defaults to a single acknowledgement. */
  actions?: AlertAction[];
};

type AlertPayload = AlertOptions & { id: number };

const DEFAULT_ACTIONS: AlertAction[] = [{ label: 'OK' }];

/**
 * One accent hue leads per tone; the chip fill and the icon carry it, and the
 * border stays the shared hairline. Colour is never the only signal — the icon
 * shape changes with the tone as well.
 */
const TONES: Record<
  AlertTone,
  { icon: keyof typeof Ionicons.glyphMap; color: string; chip: string }
> = {
  neutral: {
    icon: 'information-circle-outline',
    color: appColors.accentBright,
    chip: appColors.accentWash,
  },
  success: {
    icon: 'checkmark-circle-outline',
    color: appColors.income,
    chip: appColors.incomeSubtle,
  },
  warning: {
    icon: 'warning-outline',
    color: appColors.warning,
    chip: appColors.warningSubtle,
  },
  danger: {
    icon: 'alert-circle-outline',
    color: appColors.expense,
    chip: appColors.expenseSubtle,
  },
};

function resolveActions(actions: AlertAction[] | undefined): AlertAction[] {
  const list = actions && actions.length > 0 ? actions : DEFAULT_ACTIONS;

  // One action is the thing to do, so it leads. Two or more are a choice, so
  // nothing fills unless the caller asked for it.
  if (list.length === 1) {
    return [{ ...list[0], style: list[0].style ?? 'primary' }];
  }

  return list.map((action) => ({
    ...action,
    style: action.style ?? 'secondary',
  }));
}

let listener: ((payload: AlertPayload | null) => void) | null = null;
let queued: AlertPayload[] = [];
let sequence = 0;

/** Show a product alert. Safe from anywhere, including before mount. */
export function showAlert(options: AlertOptions) {
  sequence += 1;
  const payload: AlertPayload = { ...options, id: sequence };

  if (listener) {
    listener(payload);
    return;
  }

  queued.push(payload);
}

export function AppAlertHost() {
  // Read-only, deliberately: the queue is drained by the subscription below,
  // so re-running this initialiser (StrictMode does) yields the same payload
  // instead of swallowing it.
  const [payload, setPayload] = useState<AlertPayload | null>(
    () => queued[queued.length - 1] ?? null,
  );
  /**
   * Held separately from `payload` so the content is still mounted while the
   * system fades the panel out. Clearing the payload with `visible` would cut
   * the content away before the fade finished.
   */
  const [visible, setVisible] = useState(payload !== null);

  useEffect(() => {
    const handle = (next: AlertPayload | null) => {
      setPayload(next);
      setVisible(next !== null);
    };

    listener = handle;
    // Whatever was waiting is now reachable through `listener`.
    queued = [];

    return () => {
      if (listener === handle) {
        listener = null;
      }
    };
  }, []);

  const dismiss = useCallback(() => setVisible(false), []);

  const runAction = useCallback((action?: AlertAction) => {
    setVisible(false);
    action?.onPress?.();
  }, []);

  if (!payload) {
    return null;
  }

  const tone = TONES[payload.tone ?? 'neutral'];
  const actions = resolveActions(payload.actions);
  const icon = payload.icon ?? tone.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.scrim}>
        {/* Behind the panel: tapping the room dismisses, tapping the panel does not. */}
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={styles.scrimCatch}
        />

        <View style={styles.panel} accessibilityViewIsModal>
          <View style={[styles.chip, { backgroundColor: tone.chip }]}>
            <Ionicons name={icon} size={24} color={tone.color} />
          </View>

          <AppText variant="section" tone="primary" style={styles.title}>
            {payload.title}
          </AppText>

          {payload.message ? (
            <AppText variant="bodySmall" tone="secondary" style={styles.message}>
              {payload.message}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            {actions.map((action, index) => (
              <Button
                key={`${action.label}-${index}`}
                title={action.label}
                variant={action.style ?? 'secondary'}
                size="md"
                fullWidth
                onPress={() => runAction(action)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: appColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appSpace.xxl,
  },

  /** Absolute-filled and behind, so panel touches never fall through to it. */
  scrimCatch: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  panel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: appColors.canvasElevated,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: appRadius.group,
    padding: appSpace.xxl,
    ...appShadows.raised,
  },

  chip: {
    width: 48,
    height: 48,
    borderRadius: appRadius.control,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: appSpace.lg,
  },

  title: {
    marginBottom: appSpace.sm,
  },

  message: {
    marginBottom: appSpace.xl,
  },

  actions: {
    gap: appSpace.sm,
    marginTop: appSpace.lg,
  },
});
