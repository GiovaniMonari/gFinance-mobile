/**
 * Econva — Legal Document Viewer Screen
 *
 * Displays published legal documents (Termos de Uso, Política de Privacidade)
 * with full version history, section breakdown, pending placeholder indicators,
 * and optional explicit acknowledgement action.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  getLegalDocument,
  getPendingFields,
  getAcceptanceStatus,
  recordAcceptance,
  getCurrentVersion,
  type LegalSection,
} from '../legal';
import { appColors, appRadius, appSpace } from '../theme/app';
import {
  AppHeader,
  AppText,
  ScrollScreen,
  Surface,
  showAlert,
} from '../components/app';
import { Button } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'LegalDocument'>;

export function LegalDocumentScreen({ navigation, route }: Props) {
  const { key, requireAcceptance = false, userId } = route.params;

  const document = getLegalDocument(key);
  const currentVersion = getCurrentVersion(key);
  const pendingFields = getPendingFields(key);

  const [acceptedDate, setAcceptedDate] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    getAcceptanceStatus(userId).then((status) => {
      if (!isMounted) return;
      const docStatus = status.documents[key];
      if (docStatus && docStatus.acceptedAt && !docStatus.pending) {
        setAcceptedDate(docStatus.acceptedAt);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [key, userId]);

  if (!document || !currentVersion) {
    return (
      <ScrollScreen>
        <AppHeader
          title="Documento não encontrado"
          onBackPress={() => navigation.goBack()}
        />
        <Surface variant="subtle" padding="lg">
          <AppText tone="secondary">
            O documento solicitado não está disponível no momento.
          </AppText>
        </Surface>
      </ScrollScreen>
    );
  }

  const handleAccept = async () => {
    if (!userId) {
      navigation.goBack();
      return;
    }

    try {
      setAccepting(true);
      const termsVer = getCurrentVersion('terms')?.version ?? '1.0';
      const privacyVer = getCurrentVersion('privacy')?.version ?? '1.0';

      await recordAcceptance({
        userId,
        termsVersion: key === 'terms' ? currentVersion.version : termsVer,
        privacyVersion: key === 'privacy' ? currentVersion.version : privacyVer,
      });

      showAlert({
        title: 'Documento reconhecido',
        message: `Você aceitou a versão ${currentVersion.version} de ${document.title}.`,
        tone: 'success',
        actions: [
          {
            label: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      });
    } catch (error) {
      showAlert({
        title: 'Erro ao registrar aceite',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível registrar o aceite. Tente novamente.',
        tone: 'danger',
      });
    } finally {
      setAccepting(false);
    }
  };

  const formattedAcceptedDate = acceptedDate
    ? new Date(acceptedDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <ScrollScreen>
      <AppHeader
        title={document.title}
        eyebrow="Jurídico & Compliance"
        onBackPress={() => navigation.goBack()}
        bordered
      />

      {/* Header Document Summary */}
      <Surface variant="subtle" radius="group" padding="lg" style={styles.summaryCard}>
        <View style={styles.badgeRow}>
          <View style={styles.versionBadge}>
            <Ionicons name="document-text-outline" size={14} color={appColors.accentBright} />
            <AppText variant="captionStrong" style={styles.versionBadgeText}>
              Versão {currentVersion.version}
            </AppText>
          </View>

          {currentVersion.effectiveDate ? (
            <AppText variant="caption" tone="tertiary">
              Vigência: {currentVersion.effectiveDate}
            </AppText>
          ) : null}
        </View>

        <AppText variant="bodySmall" tone="secondary" style={styles.purposeText}>
          {document.purpose}
        </AppText>

        {formattedAcceptedDate ? (
          <View style={styles.acceptedTag}>
            <Ionicons name="checkmark-circle" size={14} color={appColors.income} />
            <AppText variant="caption" tone="primary">
              Aceito por você em {formattedAcceptedDate}
            </AppText>
          </View>
        ) : null}
      </Surface>

      {/* Pending Placeholders Indicator for Draft/Revision Notice */}
      {pendingFields.length > 0 ? (
        <Surface variant="subtle" radius="group" padding="md" style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="alert-circle-outline" size={18} color={appColors.warning} />
            <AppText variant="captionStrong" tone="warning">
              Campos em revisão jurídica
            </AppText>
          </View>
          <AppText variant="caption" tone="secondary" style={styles.noticeText}>
            Este documento possui {pendingFields.length} campo(s) pendente(s) de preenchimento formal pelo responsável legal: {pendingFields.slice(0, 3).join(', ')}{pendingFields.length > 3 ? '...' : ''}.
          </AppText>
        </Surface>
      ) : null}

      {/* Document Sections */}
      <View style={styles.sectionsContainer}>
        {currentVersion.sections.map((section) => (
          <DocumentSectionCard key={section.id} section={section} />
        ))}
      </View>

      {/* Bottom Acceptance Action */}
      {requireAcceptance ? (
        <View style={styles.actionContainer}>
          <Button
            title={`Concordar e aceitar (${currentVersion.version})`}
            loadingTitle="Registrando..."
            loading={accepting}
            onPress={handleAccept}
          />
        </View>
      ) : (
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={appColors.textTertiary} />
          <AppText variant="caption" tone="tertiary">
            Documento mantido com integridade de versão no Econva.
          </AppText>
        </View>
      )}
    </ScrollScreen>
  );
}

function DocumentSectionCard({ section }: { section: LegalSection }) {
  return (
    <View style={styles.sectionCard}>
      <AppText variant="section" tone="primary" style={styles.sectionHeading}>
        {section.heading}
      </AppText>

      {section.paragraphs?.map((p, idx) => (
        <AppText key={idx} variant="bodySmall" tone="secondary" style={styles.paragraph}>
          {p}
        </AppText>
      ))}

      {section.items && section.items.length > 0 ? (
        <View style={styles.itemsList}>
          {section.items.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <AppText variant="bodySmall" tone="secondary" style={styles.bulletText}>
                {item}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {section.closing?.map((c, idx) => (
        <AppText key={idx} variant="caption" tone="tertiary" style={styles.closingText}>
          {c}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginTop: appSpace.md,
    marginBottom: appSpace.md,
    gap: appSpace.sm,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    backgroundColor: appColors.accentWash,
    paddingHorizontal: appSpace.sm,
    paddingVertical: appSpace.xs / 2,
    borderRadius: appRadius.sm,
  },

  versionBadgeText: {
    color: appColors.accentBright,
  },

  purposeText: {
    marginTop: appSpace.xs,
    lineHeight: 20,
  },

  acceptedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
    marginTop: appSpace.xs,
    paddingTop: appSpace.xs,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
  },

  noticeCard: {
    marginBottom: appSpace.md,
    gap: appSpace.xs,
    borderColor: appColors.warning,
    borderWidth: 1,
  },

  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appSpace.xs,
  },

  noticeText: {
    lineHeight: 18,
  },

  sectionsContainer: {
    marginTop: appSpace.sm,
    gap: appSpace.xl,
    paddingBottom: appSpace.xxl,
  },

  sectionCard: {
    gap: appSpace.sm,
  },

  sectionHeading: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: appSpace.xs,
  },

  paragraph: {
    lineHeight: 22,
  },

  itemsList: {
    marginTop: appSpace.xs,
    marginBottom: appSpace.xs,
    gap: appSpace.sm,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appSpace.sm,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: appColors.accentBright,
    marginTop: 8,
  },

  bulletText: {
    flex: 1,
    lineHeight: 22,
  },

  closingText: {
    marginTop: appSpace.xs,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  actionContainer: {
    marginTop: appSpace.xl,
    marginBottom: appSpace.xxl,
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appSpace.xs,
    marginTop: appSpace.lg,
    marginBottom: appSpace.xxl,
  },
});
