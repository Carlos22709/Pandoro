import { useRouter } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { Pandoro } from '@/components/art/Pandoro';
import { VoiceBird } from '@/components/art/VoiceBird';
import { AnimatedActionButton } from '@/components/controls/AnimatedActionButton';
import { ProgressWidget } from '@/components/home/ProgressWidget';
import { SpeechBubble } from '@/components/home/SpeechBubble';
import { AppIcon } from '@/components/icons/AppIcon';
import { palette } from '@/theme/palette';

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pandaSize = Math.min(width * 0.69, height * 0.35, 278);
  const compact = height < 720;

  return (
    <View style={styles.screen}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ForestScene />
      </View>

      <View style={[styles.safeContent, { paddingTop: insets.top + 9 }]}>
        <View style={styles.topRow}>
          <ProgressWidget />
        </View>

        <View style={[styles.main, compact && styles.mainCompact]}>
          <SpeechBubble />

          <View style={styles.characterStage} pointerEvents="box-none">
            <View style={[styles.companionBird, compact && styles.companionBirdCompact]} pointerEvents="none">
              <VoiceBird size={compact ? 48 : 58} />
            </View>
            <Pandoro size={pandaSize} />
          </View>

          <View style={[styles.actions, { marginBottom: Math.max(insets.bottom, 8) + 84 }]}>
            <AnimatedActionButton
              label="Mis tareas"
              tone="lilac"
              onPress={() => router.push('/tareas')}
            >
              <AppIcon name="checklist" color={palette.lilacDeep} size={42} />
            </AnimatedActionButton>

            <AnimatedActionButton
              label="Hablar con Pandoro"
              accessibilityLabel="Hablar con Pandoro"
              tone="blue"
              emphasized
              onPress={() => router.push('/hablar')}
            >
              <VoiceBird size={62} />
            </AnimatedActionButton>

            <AnimatedActionButton
              label="Nueva tarea"
              tone="pink"
              onPress={() => router.push('/nueva-tarea')}
            >
              <AppIcon name="plus" color={palette.pinkDeep} size={49} strokeWidth={2.8} />
            </AnimatedActionButton>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
    backgroundColor: palette.sky,
  },
  safeContent: {
    flex: 1,
  },
  topRow: {
    height: 72,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  main: {
    flex: 1,
    paddingTop: 10,
  },
  mainCompact: {
    paddingTop: 0,
  },
  characterStage: {
    flex: 1,
    minHeight: 226,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -9,
  },
  companionBird: {
    position: 'absolute',
    left: '13%',
    bottom: '17%',
    zIndex: 2,
  },
  companionBirdCompact: {
    left: '10%',
    bottom: '14%',
  },
  actions: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
});
