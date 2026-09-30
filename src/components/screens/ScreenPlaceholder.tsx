import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { VoiceBird } from '@/components/art/VoiceBird';
import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { palette } from '@/theme/palette';
import { typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type PlaceholderSymbol = AppIconName | 'bird';

type ScreenPlaceholderProps = {
  title: string;
  subtitle?: string;
  symbol: PlaceholderSymbol;
  secondary?: boolean;
};

export function ScreenPlaceholder({
  title,
  subtitle = 'Esta pantalla estará disponible en una próxima versión.',
  symbol,
  secondary = false,
}: ScreenPlaceholderProps) {
  const router = useRouter();

  const goBack = () => {
    if (secondary && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/inicio');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <ForestScene />
      </View>
      <View pointerEvents="none" style={styles.backgroundWash} />

      {secondary ? (
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <AppIcon name="back" size={22} color={palette.lilacDeep} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.tabHeader}>
          <Text style={styles.screenTitle}>{title}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.symbolSurface}>
          {symbol === 'bird' ? (
            <VoiceBird size={54} />
          ) : (
            <AppIcon name={symbol} color={palette.lilacDeep} size={31} strokeWidth={2.2} />
          )}
        </View>
        <Text style={styles.title}>{secondary ? title : 'En preparación'}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: palette.sky,
  },
  backgroundArt: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.52,
  },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: ui.surface.landscapeWash,
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    width: ui.size.touch,
    height: ui.size.touch,
    borderRadius: ui.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  tabHeader: {
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: ui.space.xl,
  },
  screenTitle: {
    ...typeScale.title,
    color: palette.ink,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: ui.space.xl,
    paddingBottom: 112,
  },
  symbolSurface: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  title: {
    ...typeScale.heading,
    marginTop: 22,
    color: palette.ink,
  },
  subtitle: {
    ...typeScale.body,
    maxWidth: 310,
    marginTop: 8,
    color: palette.inkSoft,
    textAlign: 'left',
  },
  pressed: {
    opacity: 0.72,
  },
});
