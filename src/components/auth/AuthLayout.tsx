import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackdrop } from '@/components/art/AuthBackdrop';
import type { PandoroHeadVariant } from '@/components/art/PandoroHead';
import { PandoroBrandMark } from '@/components/auth/PandoroBrandMark';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import { type PaletteTone, palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

export type AuthTone = Extract<PaletteTone, 'blue' | 'pink'>;

// Cada pantalla de acceso tiene su tono propio dentro de la misma escena.
const TONE_SCENE: Record<AuthTone, { background: string; hill: string; head: PandoroHeadVariant }> = {
  blue: { background: palette.onboardingSkyBlue, hill: palette.blue, head: 'blue' },
  pink: { background: palette.onboardingSkyPink, hill: palette.pink, head: 'pink' },
};

type AuthLayoutProps = {
  tone: AuthTone;
  title: string;
  subtitle?: string;
  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
  notice?: string | null;
  switchPrompt: string;
  switchLabel: string;
  onSwitch: () => void;
  children: ReactNode;
};

export function AuthLayout({
  tone,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  submitting = false,
  error,
  notice,
  switchPrompt,
  switchLabel,
  onSwitch,
  children,
}: AuthLayoutProps) {
  const { height } = useWindowDimensions();
  const scene = TONE_SCENE[tone];

  return (
    <View style={[styles.screen, { backgroundColor: scene.background }]}>
      <AuthBackdrop hillColor={scene.hill} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="padding" style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.brandMark}>
                  <PandoroBrandMark variant={scene.head} size={Math.min(116, height * 0.14)} />
                </View>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>

              <View style={styles.form}>{children}</View>

              {error ? (
                <Text accessibilityLiveRegion="polite" role="alert" style={styles.error}>{error}</Text>
              ) : null}
              {notice ? (
                <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>
              ) : null}

              <PrimaryButton label={submitLabel} onPress={onSubmit} loading={submitting} />

              <View style={styles.switchRow}>
                <Text style={styles.switchPrompt}>{switchPrompt}</Text>
                <AuthLink label={switchLabel} emphasized onPress={onSwitch} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type AuthLinkProps = {
  label: string;
  onPress: () => void;
  emphasized?: boolean;
};

export function AuthLink({ label, onPress, emphasized = false }: AuthLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Text style={[styles.link, emphasized && styles.linkEmphasized]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: ui.space.xl,
    paddingVertical: ui.space.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: ui.space.xl,
  },
  brandMark: {
    alignSelf: 'center',
  },
  title: {
    ...typeScale.title,
    marginTop: ui.space.lg,
    color: palette.ink,
    textAlign: 'left',
  },
  subtitle: {
    ...typeScale.body,
    maxWidth: 320,
    marginTop: 8,
    color: palette.inkSoft,
    textAlign: 'left',
  },
  form: {
    gap: 14,
    marginBottom: ui.space.xl,
  },
  error: {
    ...typeScale.small,
    fontFamily: fonts.semibold,
    marginTop: -ui.space.md,
    marginBottom: ui.space.md,
    color: palette.ink,
  },
  notice: {
    ...typeScale.small,
    fontFamily: fonts.semibold,
    marginTop: -ui.space.md,
    marginBottom: ui.space.md,
    color: palette.greenDeep,
  },
  switchRow: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    columnGap: 6,
    rowGap: 4,
  },
  switchPrompt: {
    ...typeScale.small,
    color: palette.inkSoft,
  },
  link: {
    ...typeScale.small,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
  linkEmphasized: {
    fontFamily: fonts.bold,
    color: palette.lilacDeep,
  },
  pressed: {
    opacity: 0.7,
  },
});
