/**
 * Econva — Scan Receipt
 *
 * The frontend for the existing receipt-scanning endpoint.
 *
 * Flow: choose (gallery) or capture (camera) → preview → send to
 * `POST /receipts/scan` → show the acknowledgement the backend returns.
 *
 * The backend currently answers with a receipt id + PROCESSING status only —
 * no OCR fields yet — so this screen presents exactly that and says what is
 * still missing, instead of inventing extracted data.
 */

import { useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  appColors,
  appMotion,
  appRadius,
  appSpace,
} from '../theme/app';
import { Button, useEntrance } from '../components/ui';
import {
  AppHeader,
  AppText,
  EmptyState,
  ErrorState,
  ListRow,
  Metric,
  MetricDivider,
  ScrollScreen,
  Section,
  Surface,
  showAlert,
} from '../components/app';
import {
  formatReceiptSize,
  scanReceipt,
  translateReceiptStatus,
  validateReceiptImage,
  type ReceiptImage,
  type ScanReceiptResult,
} from '../api/receiptsApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PickedImage = ReceiptImage & {
  width?: number;
  height?: number;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.9,
};

export function ScanReceiptScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [image, setImage] = useState<PickedImage | null>(null);
  const [picking, setPicking] = useState<'camera' | 'gallery' | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanReceiptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headerEntrance = useEntrance();
  const bodyEntrance = useEntrance({ delay: appMotion.stagger });

  function applyPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    const picked: PickedImage = {
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      fileName: asset.fileName ?? null,
      fileSize: asset.fileSize ?? null,
      width: asset.width,
      height: asset.height,
    };

    const invalid = validateReceiptImage(picked);

    if (invalid) {
      setError(invalid);
      showAlert({ title: 'Arquivo inválido', message: invalid, tone: 'warning' });
      return;
    }

    setError(null);
    setResult(null);
    setImage(picked);
  }

  async function pickFromGallery() {
    if (picking || scanning) return;

    setPicking('gallery');

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert({
          title: 'Permissão necessária',
          message:
            'Permita o acesso às fotos para escolher a imagem do recibo.',
          tone: 'warning',
        });
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);

      if (!picked.canceled && picked.assets[0]) {
        Haptics.selectionAsync();
        applyPickedAsset(picked.assets[0]);
      }
    } catch {
      setError('Não foi possível abrir a galeria. Tente novamente.');
    } finally {
      setPicking(null);
    }
  }

  async function takePhoto() {
    if (picking || scanning) return;

    setPicking('camera');

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showAlert({
          title: 'Permissão necessária',
          message: 'Permita o acesso à câmera para fotografar o recibo.',
          tone: 'warning',
        });
        return;
      }

      const photo = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);

      if (!photo.canceled && photo.assets[0]) {
        Haptics.selectionAsync();
        applyPickedAsset(photo.assets[0]);
      }
    } catch {
      setError('Não foi possível abrir a câmera. Tente novamente.');
    } finally {
      setPicking(null);
    }
  }

  async function handleScan() {
    if (!image || scanning) return;

    setScanning(true);
    setError(null);

    try {
      const scanned = await scanReceipt(image);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(scanned);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível processar o recibo.';

      // Network/auth failures keep the preview so the user can retry without
      // choosing the image again; only the result is cleared.
      setError(message);
    } finally {
      setScanning(false);
    }
  }

  function handleScanAnother() {
    Haptics.selectionAsync();
    setImage(null);
    setResult(null);
    setError(null);
  }

  const busy = picking !== null || scanning;

  return (
    <ScrollScreen topInset={false}>
      <AppHeader
        title="Escanear recibo"
        eyebrow="Recibo"
        onBackPress={() => navigation.goBack()}
      />

      <Animated.View style={headerEntrance}>
        <AppText variant="micro" tone="tertiary">
          LEITURA DE RECIBO
        </AppText>
        <AppText variant="screenTitle" tone="primary" style={styles.title}>
          Digitalize o recibo
        </AppText>
        <AppText variant="bodySmall" tone="secondary" style={styles.subtitle}>
          Fotografe ou escolha a imagem e envie para o serviço de leitura.
        </AppText>
      </Animated.View>

      <Animated.View style={bodyEntrance}>
        {result ? (
          <ResultBlock
            result={result}
            onScanAnother={handleScanAnother}
            onCreateTransaction={() => navigation.navigate('CreateTransaction')}
          />
        ) : image ? (
          <PreviewBlock
            image={image}
            scanning={scanning}
            error={error}
            onRetake={() => {
              setImage(null);
              setError(null);
            }}
            onPickGallery={pickFromGallery}
            onTakePhoto={takePhoto}
            onScan={handleScan}
            onRetry={handleScan}
          />
        ) : (
          <EmptyBlock
            busy={busy}
            picking={picking}
            error={error}
            onTakePhoto={takePhoto}
            onPickGallery={pickFromGallery}
          />
        )}

        <Section
          title="Como funciona"
          eyebrow="Etapas"
          style={styles.howto}
        >
          <ListRow
            title="1. Escolha a imagem"
            meta="Câmera ou galeria, em JPG, PNG ou WEBP até 10MB"
            icon="image-outline"
            iconTone="accent"
          />
          <ListRow
            title="2. Confira a prévia"
            meta="Veja a foto antes de enviar para a leitura"
            icon="eye-outline"
            iconTone="accent"
            divider
          />
          <ListRow
            title="3. Envie para análise"
            meta="O recibo é registrado e entra em processamento"
            icon="cloud-upload-outline"
            iconTone="accent"
            divider
          />
        </Section>
      </Animated.View>
    </ScrollScreen>
  );
}

// ------------------------------------------------------------ Empty ----

function EmptyBlock({
  busy,
  picking,
  error,
  onTakePhoto,
  onPickGallery,
}: {
  busy: boolean;
  picking: 'camera' | 'gallery' | null;
  error: string | null;
  onTakePhoto: () => void;
  onPickGallery: () => void;
}) {
  if (error && !busy) {
    return (
      <View style={styles.block}>
        <ErrorState
          title="Algo não saiu como esperado"
          description={error}
          retryLabel="Tentar novamente"
          onRetry={onTakePhoto}
        />
        <Button
          title="Escolher da galeria"
          variant="secondary"
          size="md"
          icon="image-outline"
          onPress={onPickGallery}
          disabled={busy}
          style={styles.retrySecondary}
        />
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <EmptyState
        icon="scan-outline"
        title="Fotografe o recibo"
        description="Centralize o recibo, evite sombras e garanta que os valores estejam legíveis."
      />

      <Button
        title={picking === 'camera' ? 'Abrindo câmera...' : 'Tirar foto'}
        onPress={onTakePhoto}
        loading={picking === 'camera'}
        disabled={busy}
        size="lg"
        icon="camera-outline"
        fullWidth
        style={styles.primaryAction}
      />
      <Button
        title={picking === 'gallery' ? 'Abrindo galeria...' : 'Escolher da galeria'}
        onPress={onPickGallery}
        loading={picking === 'gallery'}
        disabled={busy}
        variant="secondary"
        size="lg"
        icon="image-outline"
        fullWidth
      />
    </View>
  );
}

// ---------------------------------------------------------- Preview ----

function PreviewBlock({
  image,
  scanning,
  error,
  onRetake,
  onPickGallery,
  onTakePhoto,
  onScan,
  onRetry,
}: {
  image: PickedImage;
  scanning: boolean;
  error: string | null;
  onRetake: () => void;
  onPickGallery: () => void;
  onTakePhoto: () => void;
  onScan: () => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.block}>
      <Section
        title="Prévia"
        eyebrow="Confira"
        description="Veja a imagem antes de enviar para a leitura"
      >
        <Surface variant="subtle" radius="group" padding="sm">
          <Image
            source={{ uri: image.uri }}
            style={styles.preview}
            resizeMode="cover"
            accessibilityLabel="Prévia do recibo selecionado"
          />

          <View style={styles.previewMeta}>
            <View style={styles.previewMetaRow}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color={appColors.textTertiary}
              />
              <AppText variant="meta" tone="secondary" numberOfLines={1}>
                {image.fileName ?? 'recibo.jpg'}
              </AppText>
            </View>
            <AppText variant="meta" tone="tertiary">
              {typeof image.fileSize === 'number'
                ? formatReceiptSize(image.fileSize)
                : image.mimeType ?? 'Imagem'}
              {typeof image.fileSize === 'number' && image.mimeType
                ? ` • ${image.mimeType}`
                : ''}
            </AppText>
          </View>
        </Surface>
      </Section>

      {error ? (
        <Surface variant="negative" radius="group" padding="md" style={styles.error}>
          <View style={styles.errorRow}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={appColors.expense}
            />
            <AppText variant="bodySmall" tone="primary" style={styles.errorText}>
              {error}
            </AppText>
          </View>
        </Surface>
      ) : null}

      <Button
        title={scanning ? 'Processando recibo...' : error ? 'Tentar enviar novamente' : 'Enviar para análise'}
        onPress={error && !scanning ? onRetry : onScan}
        loading={scanning}
        loadingTitle="Processando recibo..."
        disabled={scanning}
        size="lg"
        icon="scan-outline"
        fullWidth
        style={styles.primaryAction}
      />

      <View style={styles.previewActions}>
        <Button
          title="Tirar outra"
          variant="secondary"
          size="md"
          icon="camera-outline"
          onPress={onTakePhoto}
          disabled={scanning}
          style={styles.halfButton}
        />
        <Button
          title="Galeria"
          variant="secondary"
          size="md"
          icon="image-outline"
          onPress={onPickGallery}
          disabled={scanning}
          style={styles.halfButton}
        />
      </View>

      <Button
        title="Remover imagem"
        variant="quiet"
        size="md"
        icon="trash-outline"
        onPress={onRetake}
        disabled={scanning}
      />

      {scanning ? (
        <View style={styles.scanningHint}>
          <AppText variant="caption" tone="tertiary" style={styles.center}>
            Enviando a imagem e aguardando a leitura. A extração roda no
            servidor e pode levar de um a alguns minutos — não feche a tela.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

// ----------------------------------------------------------- Result ----

function ResultBlock({
  result,
  onScanAnother,
  onCreateTransaction,
}: {
  result: ScanReceiptResult;
  onScanAnother: () => void;
  onCreateTransaction: () => void;
}) {
  return (
    <View style={styles.block}>
      <Surface variant="positive" radius="group" padding="lg">
        <View style={styles.resultHeader}>
          <View style={styles.resultIcon}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={appColors.income}
            />
          </View>
          <View style={styles.resultText}>
            <AppText variant="bodySemibold" tone="primary">
              {result.message || 'Recibo recebido com sucesso.'}
            </AppText>
            <AppText variant="caption" tone="secondary">
              {translateReceiptStatus(result.status)} • ID {result.receiptId}
            </AppText>
          </View>
        </View>
      </Surface>

      <Section
        title="Recibo registrado"
        eyebrow="Retorno do serviço"
        description="O que o backend confirmou até agora"
        style={styles.resultSection}
      >
        <Surface variant="subtle" radius="group" padding="lg">
          <View style={styles.metrics}>
            <Metric
              label="Status"
              value={translateReceiptStatus(result.status)}
              tone="positive"
            />
            <MetricDivider />
            <Metric
              label="Tamanho"
              value={formatReceiptSize(result.size)}
              tone="primary"
              align="end"
            />
          </View>

          <View style={styles.resultRows}>
            <ListRow
              title="Identificador"
              meta={result.receiptId}
              icon="finger-print-outline"
              iconTone="accent"
              divider
            />
            <ListRow
              title={result.originalName || result.filename}
              meta={`${result.mimeType} • ${result.filename}`}
              icon="document-text-outline"
              iconTone="neutral"
              divider
            />
          </View>
        </Surface>
      </Section>

      <Surface variant="outline" radius="group" padding="md" style={styles.note}>
        <View style={styles.noteRow}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={appColors.accentBright}
          />
          <AppText variant="caption" tone="secondary" style={styles.noteText}>
            {result.extractedData &&
            (result.extractedData.merchant ||
              result.extractedData.total !== null) ? (
              <>
                Leitura concluída pelo serviço.
                {result.extractedData.merchant
                  ? ` Estabelecimento: ${result.extractedData.merchant}.`
                  : ''}
                {result.extractedData.total !== null
                  ? ` Total: ${result.extractedData.total}.`
                  : ''}
              </>
            ) : (
              <>
                O serviço leu o texto do recibo abaixo, mas ainda não separa
                estabelecimento, valor total e itens em campos próprios. Use o
                texto para conferir e crie a transação manualmente.
              </>
            )}
          </AppText>
        </View>
      </Surface>

      {result.extractedData?.rawText ? (
        <Section
          title="Texto lido"
          eyebrow="OCR"
          description="Transcrição direta da imagem, sem tratamento"
          style={styles.resultSection}
        >
          <Surface variant="subtle" radius="group" padding="lg">
            <AppText variant="caption" tone="secondary">
              {result.extractedData.rawText}
            </AppText>
          </Surface>
        </Section>
      ) : null}

      <Button
        title="Escanear outro recibo"
        onPress={onScanAnother}
        size="lg"
        icon="scan-outline"
        fullWidth
        style={styles.primaryAction}
      />
      <Button
        title="Criar transação manual"
        onPress={onCreateTransaction}
        variant="secondary"
        size="lg"
        icon="add"
        fullWidth
      />
    </View>
  );
}

// ------------------------------------------------------------ Styles ----

const styles = StyleSheet.create({
  title: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xs,
  },

  subtitle: {
    marginBottom: appSpace.xl,
  },

  block: {
    marginBottom: appSpace.xxl,
  },

  howto: {
    marginBottom: appSpace.xl,
  },

  primaryAction: {
    marginTop: appSpace.xl,
    marginBottom: appSpace.sm,
  },

  retrySecondary: {
    marginTop: appSpace.md,
  },

  preview: {
    width: '100%',
    height: 280,
    borderRadius: appRadius.group,
    backgroundColor: appColors.surfaceSunken,
  },

  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appSpace.md,
    paddingHorizontal: appSpace.sm,
    paddingVertical: appSpace.md,
  },

  previewMetaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    minWidth: 0,
  },

  previewActions: {
    flexDirection: 'row',
    gap: appSpace.sm,
  },

  halfButton: {
    flex: 1,
  },

  scanningHint: {
    marginTop: appSpace.md,
  },

  center: {
    textAlign: 'center',
  },

  error: {
    marginTop: appSpace.lg,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
  },

  errorText: {
    flex: 1,
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
  },

  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: appRadius.md,
    backgroundColor: appColors.incomeSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultText: {
    flex: 1,
    gap: 2,
  },

  resultSection: {
    marginTop: appSpace.xl,
  },

  metrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  resultRows: {
    marginTop: appSpace.lg,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  note: {
    marginTop: appSpace.lg,
    marginBottom: appSpace.xl,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.md,
  },

  noteText: {
    flex: 1,
  },
});
