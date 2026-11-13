import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useAuth } from '@/components/auth/AuthProvider';
import { useDemo } from '@/demo/DemoProvider';
import { pandaTrailFraction } from '@/services/progress/pandaPath';
import { loadSeen, peekSeen, saveSeen } from '@/services/progress/pandaSeen';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type TabPressNavigation = {
  addListener: (event: 'tabPress', callback: () => void) => () => void;
};

// Lugar nuevo: pausa para ubicarse, Pandoro camina hasta él, el lugar florece y se abre la ficha.
type ArrivalPhase = 'idle' | 'intro' | 'walking' | 'blooming' | 'arrived';

const INTRO_MS = 500;
const BLOOM_MS = 1100;
// La caminata hasta el lugar nuevo usa los mismos pasitos que las demás, sin pasar de este tope.
const MAX_WALK_MS = 3200;
// Cada paso nuevo: pausa para ubicarse y luego Pandoro avanza por el sendero.
const STEP_DELAY_MS = 500;
// El recorrido dura más cuanto más lejos va, con saltitos parejos: se ve caminar, no teletransportarse.
const STEP_BASE_MS = 2200;
const STEP_PER_UNIT_MS = 3000;
const stepDuration = (from: number, to: number) => STEP_BASE_MS + (to - from) * STEP_PER_UNIT_MS;
const stepHops = (from: number, to: number) => 5 + Math.round((to - from) * 14);
const PRESENTATION_MODE_AVAILABLE = (
  (typeof __DEV__ !== 'undefined' && __DEV__)
  || process.env.EXPO_PUBLIC_PRESENTATION_MODE === 'true'
);
const FINAL_STAGE_ID = PROGRESS_WORLD_STAGES.at(-1)?.id ?? 1;

// Pandoro solo avanza o se queda: nunca retrocede. Su última posición vista se guarda en el dispositivo
// (src/services/progress/pandaSeen.ts) para poder mostrar el recorrido aunque se haya cerrado la app.
type StepMove = { from: number; to: number; key: number; duration: number };

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as TabPressNavigation;
  const { progress, pendingUnlock, finishUnlock } = useDemo();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const positionedRef = useRef(false);
  const arrivalRef = useRef(false);
  const [phase, setPhase] = useState<ArrivalPhase>('idle');
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const uid = useAuth().user?.uid ?? null;
  const [stepMove, setStepMove] = useState<StepMove | null>(null);
  const [walkMs, setWalkMs] = useState(MAX_WALK_MS);
  const [presentationPreview, setPresentationPreview] = useState(false);
  const stepKeyRef = useRef(0);

  const arriving = phase !== 'idle';
  const arrivalStage = PROGRESS_WORLD_STAGES.find((stage) => stage.id === pendingUnlock);
  const realCurrentStage = PROGRESS_WORLD_STAGES.find((stage) => stage.id === progress.currentStage);
  // Hasta que Pandoro llega, el mundo se dibuja como estaba antes (también el primer cuadro, sin saltos).
  const realDisplayedStage = arrivalStage && (phase === 'idle' || phase === 'intro' || phase === 'walking')
    ? arrivalStage.id - 1
    : progress.currentStage;
  // La vista de presentación solo cambia lo dibujado; nunca toca DemoProvider ni Firestore.
  const displayedStage = presentationPreview ? FINAL_STAGE_ID : realDisplayedStage;

  const restT = pandaTrailFraction(progress.completedTasks, progress.stageStartSteps);
  const seen = (uid ? peekSeen(uid) : null) ?? null;
  // Con Pandoro ya visto en este tramo, nunca se dibuja detrás de donde estuvo (desmarcar no lo hace retroceder).
  const baseT = seen && seen.stage === progress.currentStage ? Math.max(seen.t, restT) : restT;
  // Desde dónde sale hacia el lugar nuevo: el último punto donde se le vio en el tramo anterior.
  const arrivalStartT = seen && arrivalStage && seen.stage === arrivalStage.id - 1 ? seen.t : 0;

  const stages = useMemo(
    () => buildProgressWorldStages({ ...progress, currentStage: displayedStage }),
    [progress, displayedStage],
  );
  const currentStage = stages.find((stage) => stage.status === 'current');
  // Llegada: Pandoro sale de donde se le vio y camina hasta el lugar nuevo; si no, se queda o camina sus pasos.
  const inArrival = arrivalStage !== undefined && (phase === 'idle' || phase === 'intro' || phase === 'walking');
  const markerFromT = presentationPreview ? 0 : inArrival ? arrivalStartT : stepMove ? stepMove.from : baseT;
  const markerToT = presentationPreview ? 0 : phase === 'walking' ? 1 : inArrival ? arrivalStartT : stepMove ? stepMove.to : baseT;
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;

  // Con una llegada pendiente, el encuadre deja ver el punto de partida y el destino.
  const realRestingScrollY = arrivalStage
    ? arrivalStage.y - 260
    : (realCurrentStage?.y ?? 0) - 350;
  const restingScrollY = presentationPreview ? 0 : realRestingScrollY;

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

  // Al entrar, si hubo pasos nuevos desde la última vez, Pandoro los camina a la vista del usuario.
  useFocusEffect(
    useCallback(() => {
      if (pendingUnlock !== null || !uid) return;
      const stage = progress.currentStage;
      let cancelled = false;
      let target = restT;
      let start: ReturnType<typeof setTimeout> | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;

      loadSeen(uid).then((last) => {
        if (cancelled) return;
        const sameStage = last !== null && last.stage === stage;
        // Sin visita anterior camina desde el inicio del tramo; en otro lugar (p. ej. tras reiniciar) no hay nada que mostrar.
        const from = sameStage ? last.t : last === null ? 0 : restT;
        target = Math.max(restT, sameStage ? last.t : 0);
        if (target <= from) {
          saveSeen(uid, { stage, t: target });
          return;
        }

        stepKeyRef.current += 1;
        const key = stepKeyRef.current;
        const duration = stepDuration(from, target);
        // Primero se queda donde se le vio por última vez y, tras una pausa, echa a andar.
        setStepMove({ from, to: from, key, duration });
        start = setTimeout(() => {
          setStepMove({ from, to: target, key, duration });
          timer = setTimeout(() => {
            saveSeen(uid, { stage, t: target });
            setStepMove(null);
          }, duration + 150);
        }, STEP_DELAY_MS);
      });

      return () => {
        cancelled = true;
        if (start) clearTimeout(start);
        if (timer) clearTimeout(timer);
        // Si se sale a mitad del recorrido, se da por visto.
        saveSeen(uid, { stage, t: target });
        setStepMove(null);
      };
    }, [pendingUnlock, progress.currentStage, restT, uid]),
  );

  useFocusEffect(
    useCallback(() => {
      if (pendingUnlock === null || !uid) return;

      arrivalRef.current = true;
      let cancelled = false;
      const timers: ReturnType<typeof setTimeout>[] = [];

      // Primero se lee dónde se le vio por última vez, para salir de ahí y no dar un salto atrás.
      loadSeen(uid).then((last) => {
        if (cancelled) return;
        const startT = last && last.stage === pendingUnlock - 1 ? last.t : 0;
        const duration = Math.min(MAX_WALK_MS, stepDuration(startT, 1));
        setWalkMs(duration);
        setPhase('intro');
        timers.push(
          setTimeout(() => setPhase('walking'), INTRO_MS),
          setTimeout(() => setPhase('blooming'), INTRO_MS + duration),
          setTimeout(() => {
            setPhase('arrived');
            setSelectedStageId(pendingUnlock);
          }, INTRO_MS + duration + BLOOM_MS),
        );
      });

      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
        // Si se sale de Progreso a mitad de la llegada, se da por vista.
        if (arrivalRef.current) {
          arrivalRef.current = false;
          saveSeen(uid, { stage: progress.currentStage, t: restT });
          setPhase('idle');
          setSelectedStageId(null);
          finishUnlock();
        }
      };
    }, [pendingUnlock, finishUnlock, progress.currentStage, restT, uid]),
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
    if (uid) saveSeen(uid, { stage: progress.currentStage, t: restT });
    setPhase('idle');
    finishUnlock();
  };

  const togglePresentationPreview = () => {
    const next = !presentationPreview;
    setPresentationPreview(next);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({
      y: next ? 0 : Math.max(0, realRestingScrollY),
      animated: true,
    }));
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Progreso</Text>
          <ProgressSummary
            completedTasks={progress.completedTasks}
            completedWeeks={progress.unlockedWeeks.length}
          />
        </View>

        {PRESENTATION_MODE_AVAILABLE ? (
          <View style={styles.presentationBar}>
            <View style={styles.presentationCopy}>
              <Text style={styles.presentationTitle}>Modo presentación</Text>
              <Text style={styles.presentationText}>
                {presentationPreview
                  ? 'Vista temporal del mundo completo. Tu progreso real no cambió.'
                  : 'Previsualiza los seis lugares sin guardar progreso.'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: presentationPreview }}
              onPress={togglePresentationPreview}
              style={({ pressed }) => [styles.presentationButton, pressed && styles.presentationPressed]}
            >
              <Text style={styles.presentationButtonText}>{presentationPreview ? 'Volver' : 'Ver todo'}</Text>
            </Pressable>
          </View>
        ) : null}

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
              markerFromT={markerFromT}
              markerToT={markerToT}
              markerDuration={presentationPreview ? undefined : phase === 'walking' ? walkMs : stepMove?.duration}
              markerHops={presentationPreview ? undefined : phase === 'walking'
                ? stepHops(arrivalStartT, 1)
                : stepMove ? stepHops(stepMove.from, stepMove.to) : undefined}
              markerKey={presentationPreview ? undefined : phase === 'walking' ? -1 : stepMove?.key}
              bloomingStageId={!presentationPreview && (phase === 'blooming' || phase === 'arrived') ? arrivalStage?.id : undefined}
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
  presentationBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: palette.lilacSoft,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 123, 179, 0.2)',
    zIndex: 2,
  },
  presentationCopy: {
    flex: 1,
  },
  presentationTitle: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    color: palette.lilacDeep,
  },
  presentationText: {
    ...typeScale.caption,
    color: palette.ink,
  },
  presentationButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
    backgroundColor: palette.lilacDeep,
  },
  presentationPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  presentationButtonText: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    color: palette.white,
  },
});
