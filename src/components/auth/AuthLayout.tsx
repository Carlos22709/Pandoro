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
import { type PaletteTone, palette, toneColors } from '@/theme/palette';

export type AuthTone = Extract<PaletteTone, 'blue' | 'pink'>;

// Cada pantalla de acceso tiene su tono propio dentro de la misma escena.
const TONE_SCENE: Record<AuthTone, { background: string; hill: string; head: PandoroHeadVariant }> = {
  blue: { background: palette.onboardingSkyBlue, hill: palette.blue, head: 'blue' },
  pink: { background: palette.onboardingSkyPink, hill: palette.pink, head: 'pink' },
};

type AuthLayoutProps = {
  tone: AuthTone;
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: () => void;
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
                <PandoroBrandMark variant={scene.head} size={Math.min(116, height * 0.14)} />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>

              <View style={styles.form}>{children}</View>

              <PrimaryButton label={submitLabel} tone={tone} onPress={onSubmit} />

              <View style={styles.switchRow}>
                <Text style={styles.switchPrompt}>{switchPrompt}</Text>
                <AuthLink label={switchLabel} tone={tone} emphasized onPress={onSwitch} />
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
  tone: AuthTone;
  onPress: () => void;
  // Destacado: texto intenso con un trazo de acuarela del tono debajo.
  emphasized?: boolean;
};

export function AuthLink({ label, tone, onPress, emphasized = false }: AuthLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {emphasized && (
        <View pointerEvents="none" style={[styles.linkWash, { backgroundColor: toneColors[tone].main }]} />
      )}
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
    paddingHorizontal: 28,
    paddingVertical: 28,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    marginTop: 18,
    color: palette.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320,
    marginTop: 8,
    color: palette.inkSoft,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    gap: 18,
    marginBottom: 28,
  },
  switchRow: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    rowGap: 4,
  },
  switchPrompt: {
    color: palette.inkSoft,
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    color: palette.inkSoft,
    fontSize: 15,
    fontWeight: '600',
  },
  linkEmphasized: {
    color: palette.ink,
    fontWeight: '800',
  },
  linkWash: {
    position: 'absolute',
    left: -4,
    right: -4,
    bottom: 1,
    height: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 7,
    borderBottomLeftRadius: 5,
    opacity: 0.6,
    transform: [{ rotate: '-1.5deg' }],
  },
  pressed: {
    opacity: 0.7,
  },
});
