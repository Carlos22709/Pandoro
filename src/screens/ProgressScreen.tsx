import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressLandmarkSheet } from '@/components/progress/ProgressLandmarkSheet';
import { ProgressSummary } from '@/components/progress/ProgressSummary';
import { ProgressWorld } from '@/components/progress/ProgressWorld';
import {
  PROGRESS_WORLD_STAGES,
  buildProgressWorldStages,
} from '@/components/progress/worldData';
import { useDemo } from '@/demo/DemoProvider';
import { palette } from '@/theme/palette';
import { typeScale } from '@/theme/typography';

type TabPressNavigation = {
  addListener: (event: 'tabPress', callback: () => void) => () => void;
};

// Llegada a un lugar nuevo: pausa para ubicarse, caminata, florecimiento y ficha.
type ArrivalPhase = 'idle' | 'intro' | 'walking' | 'blooming' | 'arrived';

const INTRO_MS = 550;
const WALK_MS = 2600;
const BLOOM_MS = 1100;

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as TabPressNavigation;
  const { progress, pendingUnlock, finishUnlock } = useDemo();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const positionedRef = useRef(false);
  const arrivalRef = useRef(false);
  const [phase, setPhase] = useState<ArrivalPhase>('idle');
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  const arriving = phase !== 'idle';
  const arrivalStage = PROGRESS_WORLD_STAGES.find((stage) => stage.id === pendingUnlock);
  // Mientras Pandoro no ha llegado, el mundo se dibuja como estaba antes del desbloqueo.
  const displayedStage = arrivalStage && (phase === 'intro' || phase === 'walking')
    ? arrivalStage.id - 1
    : progress.currentStage;

  const stages = useMemo(
    () => buildProgressWorldStages({ ...progress, currentStage: displayedStage }),
    [progress, displayedStage],
  );
  const currentStage = stages.find((stage) => stage.status === 'current');
  const walkTarget = phase === 'walking' ? stages.find((stage) => stage.id === arrivalStage?.id) : undefined;
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;

  // Con una llegada pendiente, el encuadre deja ver el punto de partida y el destino.
  const restingScrollY = arrivalStage
    ? arrivalStage.y - 260
    : (currentStage?.y ?? 0) - 350;

  const scrollToRest = useCallback((animated: boolean) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, restingScrollY), animated });
  }, [restingScrollY]);
  // El encuadre se aplica al entrar, no cada vez que termina una llegada.
  const scrollToRestRef = useRef(scrollToRest);
  scrollToRestRef.current = scrollToRest;

  const positionWorldAtCurrentStage = useCallback(() => {
    if (positionedRef.current) return;
    positionedRef.current = true;
    scrollToRest(false);
  }, [scrollToRest]);

  useFocusEffect(
    useCallback(() => {
      const frame = requestAnimationFrame(() => scrollToRestRef.current(false));
      return () => cancelAnimationFrame(frame);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (pendingUnlock === null) return;

      arrivalRef.current = true;
      setPhase('intro');
      const timers = [
        setTimeout(() => setPhase('walking'), INTRO_MS),
        setTimeout(() => setPhase('blooming'), INTRO_MS + WALK_MS),
        setTimeout(() => {
          setPhase('arrived');
          setSelectedStageId(pendingUnlock);
        }, INTRO_MS + WALK_MS + BLOOM_MS),
      ];

      return () => {
        timers.forEach(clearTimeout);
        // Si se sale de Progreso a mitad de la llegada, se da por vista.
        if (arrivalRef.current) {
          arrivalRef.current = false;
          setPhase('idle');
          setSelectedStageId(null);
          finishUnlock();
        }
      };
    }, [pendingUnlock, finishUnlock]),
  );

  useEffect(() => {
    return navigation.addListener('tabPress', () => {
      if (arrivalRef.current) return;
      requestAnimationFrame(() => scrollToRest(true));
    });
  }, [navigation, scrollToRest]);

  const closeSheet = () => {
    setSelectedStageId(null);
    if (!arrivalRef.current) return;
    arrivalRef.current = false;
    setPhase('idle');
    finishUnlock();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Progreso</Text>
          <ProgressSummary
            streak={progress.streak}
            completedTasks={progress.completedTasks}
          />
        </View>

        <ScrollView
          ref={scrollRef}
          scrollEnabled={!arriving}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={positionWorldAtCurrentStage}
        >
          <View pointerEvents={arriving ? 'none' : 'auto'}>
            <ProgressWorld
              currentStage={displayedStage}
              stages={stages}
              onLandmarkPress={(stage) => setSelectedStageId(stage.id)}
              walkTo={walkTarget}
              walkDuration={WALK_MS}
              bloomingStageId={phase === 'blooming' || phase === 'arrived' ? arrivalStage?.id : undefined}
            />
          </View>
        </ScrollView>
      </View>

      <ProgressLandmarkSheet
        stage={selectedStage}
        completedTasks={progress.completedTasks}
        isNew={phase === 'arrived'}
        onClose={closeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#B8D9A2',
  },
  content: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 6,
    backgroundColor: 'rgba(239, 247, 238, 0.98)',
    zIndex: 2,
  },
  title: {
    ...typeScale.title,
    color: palette.ink,
  },
});
