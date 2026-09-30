/**
 * Econva — Create Transaction
 *
 * A focused form in the product's language. The type selector is a segmented
 * control rather than three competing buttons, categories are chips, and the
 * action sits at the bottom of the scroll area.
 *
 * Validation, the API call, the success alert and navigation are unchanged.
 */

import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { TransactionType } from '../types/transaction';
import { createTransaction } from '../api/transactionApi';
import { getCategories, Category } from '../api/categoryApi';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
  appMotionScale,
  appRadius,
  appSpace,
} from '../theme/app';
import { Button, Field, useEntrance } from '../components/ui';
import {
  AppHeader,
  AppText,
  ScrollScreen,
  Section,
  showAlert,
  usePressScale,
} from '../components/app';

const TYPES: {
  value: TransactionType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'EXPENSE', label: 'Despesa', icon: 'arrow-up' },
  { value: 'INCOME', label: 'Receita', icon: 'arrow-down' },
  { value: 'DEPOSIT', label: 'Depósito', icon: 'wallet' },
];

/**
 * One segment of the type switcher.
 *
 * The selected state is drawn twice and crossfaded, because a background colour
 * and a text colour cannot be interpolated through a plain prop. Selecting a
 * type should feel like the choice moving, not like the screen repainting.
 */
function Segment({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const selected = useSharedValue(active ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    selected.value = withTiming(active ? 1 : 0, {
      duration: reducedMotion ? 0 : appMotion.state,
    });
  }, [active, reducedMotion, selected]);

  const activeStyle = useAnimatedStyle(() => ({
    opacity: selected.value,
    transform: [{ scale: 0.9 + selected.value * 0.1 }],
  }));

  const {
    style: pressStyle,
    onPressIn,
    onPressOut,
  } = usePressScale({ scale: appMotionScale.control, dim: 0.75 });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={styles.segment}
    >
      <Reanimated.View style={[styles.segmentActive, activeStyle]} pointerEvents="none" />

      <Reanimated.View style={[styles.segmentContent, pressStyle]}>
        <Ionicons name={icon} size={16} color={appColors.textTertiary} />
        <AppText variant="captionStrong" tone="tertiary">
          {label}
        </AppText>

        <Reanimated.View style={[styles.segmentLayer, activeStyle]} pointerEvents="none">
          <Ionicons name={icon} size={16} color={appColors.accentBright} />
          <AppText variant="captionStrong" color={appColors.accentBright}>
            {label}
          </AppText>
        </Reanimated.View>
      </Reanimated.View>
    </Pressable>
  );
}

/** One category option. Same crossfade as the segment, at chip scale. */
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const selected = useSharedValue(active ? 1 : 0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    selected.value = withTiming(active ? 1 : 0, {
      duration: reducedMotion ? 0 : appMotion.state,
    });
  }, [active, reducedMotion, selected]);

  const activeStyle = useAnimatedStyle(() => ({
    opacity: selected.value,
  }));

  const {
    style: pressStyle,
    onPressIn,
    onPressOut,
  } = usePressScale({ scale: appMotionScale.control, dim: 0.7 });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={styles.chip}
    >
      <Reanimated.View style={[styles.chipActive, activeStyle]} pointerEvents="none" />

      <Reanimated.View style={[styles.chipContent, pressStyle]}>
        <AppText variant="captionStrong" tone="secondary">
          {label}
        </AppText>

        <Reanimated.View style={[styles.chipLayer, activeStyle]} pointerEvents="none">
          <AppText variant="captionStrong" color={appColors.accentBright}>
            {label}
          </AppText>
        </Reanimated.View>
      </Reanimated.View>
    </Pressable>
  );
}

export function CreateTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] =
    useState<TransactionType>('EXPENSE');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories]),
  );

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  async function handleCreate() {
    if (!amount) {
      showAlert({
        title: 'Atenção',
        message: 'Informe o valor da transação.',
        tone: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const normalizedAmount = Number(amount.replace(',', '.'));
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        showAlert({
          title: 'Atenção',
          message: 'Informe um valor válido.',
          tone: 'warning',
        });
        return;
      }
      if (transactionType === 'EXPENSE' && !categoryId) {
        showAlert({
          title: 'Atenção',
          message: 'Selecione uma categoria para a despesa.',
          tone: 'warning',
        });
        return;
      }

      await createTransaction({
        amount: normalizedAmount,
        transactionType,
        description: description || undefined,
        categoryId: categoryId || undefined,
      });

      setAmount('');
      setDescription('');
      setCategoryId('');
      setTransactionType('EXPENSE');

      showAlert({
        title: 'Sucesso',
        message: 'Transação criada com sucesso.',
        tone: 'success',
        actions: [
          { label: 'OK', onPress: () => navigation.goBack() },
        ],
      });
    } catch (error) {
      showAlert({
        title: 'Erro',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível criar a transação.',
        tone: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  const formEntrance = useEntrance();
  const actionEntrance = useEntrance({ delay: appMotion.stagger });

  return (
    <ScrollScreen topInset={false}>
      <AppHeader
        title="Nova transação"
        onBackPress={() => navigation.goBack()}
      />

      <Animated.View style={formEntrance}>
        {/* Segmented control */}
        <View style={styles.segmented}>
          {TYPES.map((type) => (
            <Segment
              key={type.value}
              label={type.label}
              icon={type.icon}
              active={transactionType === type.value}
              onPress={() => {
                Haptics.selectionAsync();
                setTransactionType(type.value);
                setCategoryId('');
              }}
            />
          ))}
        </View>

        {/* Fields */}
        <Section title="Detalhes" eyebrow="Transação">
          <Field
            label="Valor"
            placeholder="0,00"
            icon="cash-outline"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <Field
            label="Descrição"
            placeholder="Ex.: Mercado"
            icon="document-text-outline"
            value={description}
            onChangeText={setDescription}
            flush={transactionType !== 'EXPENSE'}
          />

          {transactionType === 'EXPENSE' ? (
            <View style={styles.categorySection}>
              <AppText variant="label" tone="secondary" style={styles.categoryLabel}>
                Categoria
              </AppText>

              <View style={styles.categoryChips}>
                {categories.map((category) => {
                  const active = categoryId === category.id;

                  return (
                    <Chip
                      key={category.id}
                      label={category.name}
                      active={active}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategoryId(category.id);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}
        </Section>
      </Animated.View>

      <Animated.View style={[actionEntrance, styles.action]}>
        <Button
          title={loading ? 'Adicionando...' : 'Adicionar transação'}
          onPress={handleCreate}
          loading={loading}
          size="lg"
          fullWidth
        />
      </Animated.View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  /* Segmented control */
  segmented: {
    flexDirection: 'row',
    gap: appSpace.xs,
    padding: appSpace.xs,
    borderRadius: appRadius.field,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    marginBottom: appSpace.xxl,
  },

  segment: {
    flex: 1,
    height: 40,
    borderRadius: appRadius.md,
  },

  /** The selected ground, fading in behind the segment's own content. */
  segmentActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: appRadius.md,
    backgroundColor: appColors.accentWash,
  },

  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appSpace.xs,
    height: '100%',
  },

  segmentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appSpace.xs,
  },

  /* Category */
  categorySection: {
    marginTop: appSpace.lg,
  },

  categoryLabel: {
    marginBottom: appSpace.sm,
  },

  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appSpace.sm,
  },

  chip: {
    paddingHorizontal: appSpace.lg,
    height: 36,
    borderRadius: appRadius.md,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    overflow: 'hidden',
  },

  chipActive: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: appColors.accentWash,
    borderRadius: appRadius.md,
    borderWidth: 1,
    borderColor: appColors.borderAccentStrong,
  },

  chipContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  chipLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Action */
  action: {
    marginTop: appSpace.xl,
  },
});
