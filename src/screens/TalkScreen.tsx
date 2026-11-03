import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { AppIcon } from '@/components/icons/AppIcon';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import {
  PandoroAvatar,
  PandoroBubble,
  PandoroRow,
  ThinkingBubble,
  UserBubble,
} from '@/components/talk/ChatBubbles';
import { HoldToTalkButton } from '@/components/talk/HoldToTalkButton';
import { PlanCard } from '@/components/talk/PlanCard';
import { useTasks } from '@/components/tasks/TasksProvider';
import { DEMO_GREETING, DEMO_PLAN, DEMO_PLAN_ADDED_REPLY, DEMO_TURNS } from '@/demo/demoScript';
import { demoPlanTasks } from '@/demo/demoState';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type ChatItem =
  | { id: string; kind: 'pandoro'; text: string }
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'plan' };

// Lo que se está escribiendo ahora. Usa el mismo id que tendrá el mensaje confirmado
// para que la burbuja no vuelva a entrar al confirmarse.
type LiveItem = { id: string; kind: 'pandoro' | 'user'; words: string[]; shown: number };

type ChatRow =
  | ChatItem
  | { id: string; kind: 'thinking' }
  | { id: string; kind: 'liveUser' | 'livePandoro'; text: string };

type TalkPhase = 'ready' | 'listening' | 'thinking' | 'replying' | 'planning' | 'planReady' | 'added';

// Ritmos fijos para que el ensayo y la presentación salgan idénticos.
const USER_WORD_MS = 230;
const REPLY_WORD_MS = 55;
const THINKING_MS = 1200;
const MIN_HOLD_MS = 350;
const PLAN_ROW_MS = 170;

const STATUS: Record<TalkPhase, string> = {
  ready: 'Te escucho cuando quieras',
  listening: 'Escuchando…',
  thinking: 'Pensando…',
  replying: 'Escribiendo…',
  planning: 'Armando tu plan…',
  planReady: 'Tu plan está listo',
  added: 'Tu plan está listo',
};

export function TalkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, addPlannedTasks } = useTasks();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [items, setItems] = useState<ChatItem[]>([{ id: 'greeting', kind: 'pandoro', text: DEMO_GREETING }]);
  const [live, setLive] = useState<LiveItem | null>(null);
  const [phase, setPhase] = useState<TalkPhase>('ready');
  const [turn, setTurn] = useState(0);
  const [planRows, setPlanRows] = useState(0);
  const [holdHint, setHoldHint] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const turnRef = useRef(turn);
  turnRef.current = turn;
  const pressStartRef = useRef(0);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopStream = () => {
    if (streamRef.current) clearInterval(streamRef.current);
    streamRef.current = null;
  };

  const later = (delay: number, callback: () => void) => {
    timersRef.current.push(setTimeout(callback, delay));
  };

  useEffect(() => () => {
    stopStream();
    timersRef.current.forEach(clearTimeout);
  }, []);

  // Escribe un texto palabra por palabra en la burbuja en curso.
  const stream = (item: Omit<LiveItem, 'words' | 'shown'>, text: string, wordMs: number, onDone?: () => void) => {
    const words = text.split(' ');
    stopStream();
    setLive({ ...item, words, shown: 0 });
    let shown = 0;
    streamRef.current = setInterval(() => {
      shown += 1;
      setLive((current) => (current && current.id === item.id ? { ...current, shown } : current));
      if (shown >= words.length) {
        stopStream();
        onDone?.();
      }
    }, wordMs);
  };

  const startListening = () => {
    if (phaseRef.current !== 'ready') return;
    const index = turnRef.current;
    pressStartRef.current = Date.now();
    setHoldHint(false);
    setPhase('listening');
    stream({ id: `user-${index}`, kind: 'user' }, DEMO_TURNS[index].user, USER_WORD_MS);
  };

  const revealPlan = () => {
    setItems((current) => [...current, { id: 'plan', kind: 'plan' }]);
    setPhase('planning');
    DEMO_PLAN.forEach((_, index) => later(260 + index * PLAN_ROW_MS, () => setPlanRows(index + 1)));
    later(260 + DEMO_PLAN.length * PLAN_ROW_MS + 380, () => setPhase('planReady'));
  };

  const stopListening = () => {
    if (phaseRef.current !== 'listening') return;
    stopStream();

    // Un toque corto no envía nada: evita mandar la frase por accidente.
    if (Date.now() - pressStartRef.current < MIN_HOLD_MS) {
      setLive(null);
      setPhase('ready');
      setHoldHint(true);
      later(2400, () => setHoldHint(false));
      return;
    }

    const index = turnRef.current;
    const current = DEMO_TURNS[index];
    const isLastTurn = index === DEMO_TURNS.length - 1;
    setLive(null);
    setItems((all) => [...all, { id: `user-${index}`, kind: 'user', text: current.user }]);
    setPhase('thinking');

    later(THINKING_MS, () => {
      setPhase('replying');
      stream({ id: `pandoro-${index}`, kind: 'pandoro' }, current.reply, REPLY_WORD_MS, () => {
        setLive(null);
        setItems((all) => [...all, { id: `pandoro-${index}`, kind: 'pandoro', text: current.reply }]);
        if (isLastTurn) {
          revealPlan();
          return;
        }
        setTurn(index + 1);
        setPhase('ready');
      });
    });
  };

  // El plan del guion va a la misma lista que los planes de Gemini en Nueva tarea.
  const addToTasks = () => {
    addPlannedTasks(demoPlanTasks(tasks));
    setPhase('added');
    later(380, () => {
      stream({ id: 'pandoro-added', kind: 'pandoro' }, DEMO_PLAN_ADDED_REPLY, REPLY_WORD_MS, () => {
        setLive(null);
        setItems((all) => [...all, { id: 'pandoro-added', kind: 'pandoro', text: DEMO_PLAN_ADDED_REPLY }]);
      });
    });
  };

  const seeTasks = () => router.dismissTo('/tareas');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Una sola lista: lo que está en curso comparte id con el mensaje que confirmará, así
  // React conserva la misma fila (Pandoro "piensa" y luego escribe en el mismo sitio).
  const liveText = live ? live.words.slice(0, live.shown).join(' ') : '';
  const rows: ChatRow[] = [
    ...items,
    ...(phase === 'thinking' ? [{ id: `pandoro-${turn}`, kind: 'thinking' } as const] : []),
    ...(live ? [{ id: live.id, kind: live.kind === 'user' ? 'liveUser' : 'livePandoro', text: liveText } as const] : []),
  ];

  const renderRow = (row: ChatRow, index: number) => {
    if (row.kind === 'user' || row.kind === 'liveUser') {
      return <UserBubble key={row.id} text={row.text} live={row.kind === 'liveUser'} />;
    }
    const previous = rows[index - 1];
    const followsPandoro = previous !== undefined && previous.kind !== 'user' && previous.kind !== 'liveUser';
    return (
      <PandoroRow key={row.id} showAvatar={!followsPandoro} wide={row.kind === 'plan'}>
        {row.kind === 'thinking' ? <ThinkingBubble /> : null}
        {row.kind === 'pandoro' || row.kind === 'livePandoro' ? <PandoroBubble text={row.text} /> : null}
        {row.kind === 'plan' ? (
          <PlanCard plan={DEMO_PLAN} visibleRows={planRows} added={phase === 'added'} />
        ) : null}
      </PandoroRow>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.backgroundArt}>
        <ForestScene />
      </View>
      <View pointerEvents="none" style={styles.backgroundWash} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon name="back" size={22} color={palette.lilacDeep} />
        </Pressable>
        <PandoroAvatar size={40} />
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Pandoro</Text>
          <Text style={styles.headerStatus}>{STATUS[phase]}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
      >
        {rows.map(renderRow)}
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        {phase === 'planReady' || phase === 'added' ? (
          <Animated.View key={phase} entering={FadeIn.duration(260)} style={styles.dockAction}>
            {phase === 'planReady' ? (
              <PrimaryButton label="Agregar a mis tareas" onPress={addToTasks} />
            ) : (
              <PrimaryButton label="Ver mis tareas" onPress={seeTasks} />
            )}
          </Animated.View>
        ) : (
          <>
            <HoldToTalkButton
              listening={phase === 'listening'}
              disabled={phase !== 'ready' && phase !== 'listening'}
              onPressIn={startListening}
              onPressOut={stopListening}
            />
            <Text style={[styles.dockLabel, holdHint && styles.dockHint]}>
              {holdHint
                ? 'Mantén pulsado el pajarito mientras hablas'
                : phase === 'listening'
                  ? 'Te escucho… suelta para enviar'
                  : phase === 'ready'
                    ? 'Mantén pulsado para hablar'
                    : phase === 'planning'
                      ? 'Pandoro está armando tu plan…'
                      : 'Pandoro está respondiendo…'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
    overflow: 'hidden',
    backgroundColor: palette.sky,
  },
  backgroundArt: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.5,
  },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(247, 250, 244, 0.55)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(250, 251, 246, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: ui.surface.border,
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
  pressed: {
    opacity: 0.72,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    ...typeScale.body,
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 23,
    color: palette.ink,
  },
  headerStatus: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    color: palette.greenDeep,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 20,
  },
  dock: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 251, 246, 0.92)',
    borderTopWidth: 1,
    borderTopColor: ui.surface.border,
  },
  dockAction: {
    width: '100%',
    maxWidth: 420,
    paddingTop: 6,
    paddingBottom: 4,
  },
  dockLabel: {
    ...typeScale.small,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
  dockHint: {
    color: palette.pinkDeep,
  },
});
