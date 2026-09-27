import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceBird } from '@/components/art/VoiceBird';
import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { palette, type PaletteTone, toneColors } from '@/theme/palette';

type PlaceholderSymbol = AppIconName | 'bird';

type ScreenPlaceholderProps = {
  title: string;
  subtitle?: string;
  tone: PaletteTone;
  symbol: PlaceholderSymbol;
  secondary?: boolean;
};

export function ScreenPlaceholder({
  title,
  subtitle = 'Esta pantalla estará disponible en una próxima versión.',
  tone,
  symbol,
  secondary = false,
}: ScreenPlaceholderProps) {
  const router = useRouter();
  const colors = toneColors[tone];

  const goBack = () => {
    if (secondary && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/inicio');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.soft }]} edges={['top', 'left', 'right']}>
      <View style={styles.decorOne} />
      <View style={[styles.decorTwo, { backgroundColor: colors.main }]} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a Inicio"
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon name="back" size={24} color={colors.deep} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.symbolSurface, { backgroundColor: colors.main }]}>
          {symbol === 'bird' ? (
            <VoiceBird size={78} />
          ) : (
            <AppIcon name={symbol} color={colors.deep} size={54} strokeWidth={2.2} />
          )}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [
            styles.homeButton,
            { backgroundColor: colors.deep },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.homeButtonLabel}>Volver a Inicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    height: 72,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(81, 64, 93, 0.08)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 112,
  },
  symbolSurface: {
    width: 126,
    height: 118,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 252, 245, 0.5)',
  },
  title: {
    marginTop: 28,
    color: palette.ink,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    maxWidth: 310,
    marginTop: 11,
    color: palette.inkSoft,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  homeButton: {
    minWidth: 170,
    height: 50,
    marginTop: 30,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonLabel: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  decorOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    top: -80,
    right: -105,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 252, 245, 0.44)',
  },
  decorTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    left: -104,
    bottom: 80,
    borderRadius: 90,
    opacity: 0.26,
  },
});
