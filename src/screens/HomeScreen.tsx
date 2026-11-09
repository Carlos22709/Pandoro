import { useIsFocused, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { Pandoro } from '@/components/art/Pandoro';
import { VoiceBird } from '@/components/art/VoiceBird';
import { AnimatedActionButton } from '@/components/controls/AnimatedActionButton';
import {
  ORIGAMI_REVEAL_MS,
  OrigamiBackdrop,
  OrigamiGround,
  type OrigamiRevealPhase,
} from '@/components/home/OrigamiGarden';
import { ProgressWidget } from '@/components/home/ProgressWidget';
import { SpeechBubble } from '@/components/home/SpeechBubble';
import { AppIcon } from '@/components/icons/AppIcon';
import { useDemo } from '@/demo/DemoProvider';
import { HOME_BUBBLE } from '@/demo/demoScript';
import { pandaTrailFraction } from '@/services/progress/pandaPath';
import { palette } from '@/theme/palette';

export function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { progress, pendingHomeReveal, finishHomeReveal } = useDemo();
  const pandaSize = Math.min(width * 0.69, height * 0.35, 278);
  const compact = height < 720;

  // El origami del Bosque espera a que Inicio esté a la vista para desplegarse.
  const hasOrigami = progress.currentStage >= 2;
  const origamiPhase: OrigamiRevealPhase = !pendingHomeReveal
    ? 'shown'
    : isFocused
      ? 'revealing'
      : 'hidden';

  useEffect(() => {
    if (origamiPhase !== 'revealing') return;
    const timer = setTimeout(finishHomeReveal, ORIGAMI_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [finishHomeReveal, origamiPhase]);

  const bubbleText = hasOrigami && origamiPhase !== 'hidden' ? HOME_BUBBLE.origami : HOME_BUBBLE.initial;

  return (
    <View style={styles.screen}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* El bambú se queda debajo solo mientras el bosque de papel termina de aparecer. */}
        {!hasOrigami || origamiPhase !== 'shown' ? <ForestScene /> : null}
        {hasOrigami ? <OrigamiBackdrop phase={origamiPhase} /> : null}
      </View>
      <View style={styles.backgroundWash} pointerEvents="none" />

      <View style={[styles.safeContent, { paddingTop: insets.top + 9 }]}>
        <View style={styles.topRow}>
          <ProgressWidget value={pandaTrailFraction(progress.completedTasks, progress.stageStartSteps)} />
        </View>

        <View style={[styles.main, compact && styles.mainCompact]}>
          <View style={styles.characterStage} pointerEvents="box-none">
            {hasOrigami ? (
              <OrigamiGround phase={origamiPhase} foxSize={Math.round(pandaSize * 0.37)} />
            ) : null}
            <SpeechBubble text={bubbleText} bottomOffset={pandaSize * 0.82} />
            <View style={[styles.companionBird, compact && styles.companionBirdCompact]} pointerEvents="none">
              <VoiceBird size={compact ? 48 : 58} />
            </View>
            <Pandoro size={pandaSize} />
          </View>

          <View style={[styles.actions, { marginBottom: Math.max(insets.bottom, 8) + 84 }]}>
            <AnimatedActionButton
              label="Hablar con Pandoro"
              accessibilityLabel="Hablar con Pandoro"
              variant="primary"
              onPress={() => router.push('/hablar')}
            >
              <VoiceBird size={36} />
            </AnimatedActionButton>

            <View style={styles.secondaryActions}>
              <AnimatedActionButton
                label="Mis tareas"
                onPress={() => router.push('/tareas')}
              >
                <AppIcon name="checklist" color={palette.lilacDeep} size={24} />
              </AnimatedActionButton>

              <AnimatedActionButton
                label="Nueva tarea"
                onPress={() => router.push('/nueva-tarea')}
              >
                <AppIcon name="plus" color={palette.lilacDeep} size={25} strokeWidth={2.5} />
              </AnimatedActionButton>
            </View>
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
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(247, 250, 244, 0.24)',
  },
  topRow: {
    height: 52,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  main: {
    flex: 1,
    paddingTop: 8,
  },
  mainCompact: {
    paddingTop: 0,
  },
  characterStage: {
    flex: 1,
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -4,
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
    minHeight: 122,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
