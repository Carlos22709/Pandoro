import { type ComponentRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { AppIcon } from '@/components/icons/AppIcon';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import { AvailabilityPicker } from '@/components/planning/AvailabilityPicker';
import { ProposalEditor } from '@/components/planning/ProposalEditor';
import { PandoroAvatar, PandoroBubble, PandoroRow, ThinkingBubble, UserBubble } from '@/components/talk/ChatBubbles';
import { HoldToTalkButton } from '@/components/talk/HoldToTalkButton';
import { TALK_GREETING, type TalkMessage, sendTalkTurn } from '@/components/talk/talkConversation';
import { nextPriority, useTasks } from '@/components/tasks/TasksProvider';
import { GeminiError, MAX_INPUT_LENGTH, planService, toGeminiError } from '@/services/gemini/geminiService';
import { analyzeProposal, proposalToTasks } from '@/services/planning/planLogic';
import type { Availability, PlanProposal } from '@/services/planning/planTypes';
import { useDictation } from '@/services/voice/useDictation';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type TalkPhase = 'ready' | 'thinking' | 'review' | 'saved';

const STATUS: Record<TalkPhase, string> = {
  ready: 'Te escucho cuando quieras',
  thinking: 'Pensando…',
  review: 'Revisa mi sugerencia',
  saved: 'Tu plan está listo',
};

const GREETING: TalkMessage = { id: 'greeting', from: 'pandoro', text: TALK_GREETING };

// «Hablar» conversa con el agente real (geminiService). La conversación solo vive en este estado:
// se pierde al salir y nunca se guarda ni se registra. La voz (si el dispositivo la admite) solo
// llena el mismo campo de texto: el usuario revisa la transcripción y la envía como si la escribiera.
export function TalkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, addPlannedTasks } = useTasks();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [messages, setMessages] = useState<TalkMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<TalkPhase>('ready');
  const [error, setError] = useState<GeminiError | null>(null);
  const [proposal, setProposal] = useState<PlanProposal | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [minutesPerDay, setMinutesPerDay] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  const dictation = useDictation((text) => {
    setInput((current) => (current.trim() ? `${current.trimEnd()} ${text}` : text).slice(0, MAX_INPUT_LENGTH));
  });

  const availability: Availability = { days, minutesPerDay: Number(minutesPerDay) };
  const hasAvailability = days.length > 0 && availability.minutesPerDay > 0;
  const canSend = phase === 'ready' && !dictation.listening && input.trim().length > 0 && hasAvailability;

  const issues = useMemo(
    () => (proposal ? analyzeProposal(proposal, availability) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [proposal, days, minutesPerDay],
  );
  const blocked = !proposal?.activities.length || issues.some((issue) => issue.blocking);

  const send = async () => {
    if (!canSend) return;
    setPhase('thinking');
    setError(null);
    try {
      const result = await sendTalkTurn(planService, { messages, input, availability, today: new Date() });
      setMessages(result.messages);
      setInput('');
      if (result.kind === 'proposal') {
        setProposal(result.proposal);
        setPhase('review');
      } else {
        setPhase('ready');
      }
    } catch (failure) {
      // Lo que escribió el usuario se queda en el campo para reintentar.
      setError(toGeminiError(failure));
      setPhase('ready');
    }
  };

  const confirm = () => {
    if (!proposal || blocked) return;
    setSavedCount(addPlannedTasks(proposalToTasks(proposal, nextPriority(tasks))));
    setPhase('saved');
  };

  const discard = () => {
    setProposal(null);
    setPhase('ready');
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.chat}>
        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
        >
          {messages.map((message, index) => {
            if (message.from === 'user') return <UserBubble key={message.id} text={message.text} />;
            const followsPandoro = messages[index - 1]?.from === 'pandoro';
            return (
              <PandoroRow key={message.id} showAvatar={!followsPandoro}>
                <PandoroBubble text={message.text} />
              </PandoroRow>
            );
          })}

          {phase === 'thinking' ? (
            <PandoroRow>
              <ThinkingBubble />
            </PandoroRow>
          ) : null}

          {phase === 'saved' ? (
            <PandoroRow>
              <PandoroBubble text={`¡Listo! Agregué ${savedCount} ${savedCount === 1 ? 'tarea' : 'tareas'} a tu lista. Puedes cambiarlas desde Tareas.`} />
            </PandoroRow>
          ) : null}

          {phase === 'review' && proposal ? (
            <View style={styles.card}>
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>Sugerencia de Pandoro · edítala antes de guardarla</Text>
              </View>
              {issues.length ? (
                <View style={styles.issues}>
                  {issues.map((issue, index) => (
                    <Text key={`${issue.kind}-${index}`} style={styles.issueText}>{issue.message}</Text>
                  ))}
                </View>
              ) : null}
              <ProposalEditor proposal={proposal} days={days} onChange={setProposal} />
            </View>
          ) : null}

          {phase === 'ready' || phase === 'thinking' ? (
            <View style={styles.card} pointerEvents={phase === 'thinking' ? 'none' : 'auto'}>
              <AvailabilityPicker
                days={days}
                minutesPerDay={minutesPerDay}
                onChangeDays={setDays}
                onChangeMinutes={setMinutesPerDay}
              />
            </View>
          ) : null}

          {error ? (
            <View accessibilityLiveRegion="polite" style={styles.errorCard}>
              <Text style={styles.errorText}>{error.message}</Text>
              <Text style={styles.errorHint}>Tu mensaje sigue en el campo para que lo envíes de nuevo.</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
          {phase === 'review' ? (
            <View style={styles.dockAction}>
              <PrimaryButton label="Agregar a mis tareas" onPress={confirm} />
              <Pressable accessibilityRole="button" onPress={discard} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Descartar y seguir conversando</Text>
              </Pressable>
            </View>
          ) : phase === 'saved' ? (
            <View style={styles.dockAction}>
              <PrimaryButton label="Ver mis tareas" onPress={() => router.dismissTo('/tareas')} />
            </View>
          ) : (
            <>
              {dictation.available ? (
                <HoldToTalkButton
                  listening={dictation.listening}
                  disabled={phase !== 'ready'}
                  onPressIn={dictation.start}
                  onPressOut={dictation.stop}
                />
              ) : null}
              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  editable={phase === 'ready' && !dictation.listening}
                  multiline
                  maxLength={MAX_INPUT_LENGTH}
                  placeholder="Tengo un parcial el viernes y…"
                  placeholderTextColor={palette.inkSoft}
                  accessibilityLabel="Escríbele a Pandoro"
                  style={styles.input}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar"
                  disabled={!canSend}
                  onPress={send}
                  style={({ pressed }) => [styles.sendButton, !canSend && styles.disabled, pressed && styles.pressed]}
                >
                  {phase === 'thinking' ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <Text style={styles.sendText}>Enviar</Text>
                  )}
                </Pressable>
              </View>
              <Text
                accessibilityLiveRegion="polite"
                numberOfLines={2}
                style={[styles.dockLabel, dictation.error && !dictation.listening ? styles.voiceError : null]}
              >
                {phase === 'thinking'
                  ? 'Pandoro está organizando tus responsabilidades…'
                  : dictation.listening
                    ? dictation.partial || 'Te escucho… suelta el botón cuando termines'
                    : dictation.error
                      ? dictation.error
                      : hasAvailability
                        ? 'No incluyas nombres, correos ni teléfonos'
                        : 'Elige tus días y minutos disponibles para empezar'}
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: ui.surface.base,
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
    textAlign: 'center',
  },
  voiceError: {
    color: palette.ink,
  },
  card: {
    padding: ui.space.md,
    borderRadius: ui.radius.card,
    backgroundColor: 'rgba(255, 252, 245, 0.95)',
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  draftBadge: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ui.radius.small,
    backgroundColor: palette.yellowSoft,
  },
  draftBadgeText: { ...typeScale.caption, fontFamily: fonts.bold, color: palette.yellowDeep },
  issues: { marginBottom: 8, padding: ui.space.md, gap: 5, borderRadius: ui.radius.card, backgroundColor: palette.pinkSoft },
  issueText: { ...typeScale.small, fontFamily: fonts.semibold, color: palette.ink },
  errorCard: { padding: ui.space.md, gap: 4, borderRadius: ui.radius.card, backgroundColor: palette.pinkSoft },
  errorText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.ink },
  errorHint: { ...typeScale.small, color: palette.inkSoft },
  inputRow: { width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: ui.radius.control,
    color: palette.ink,
    fontFamily: fonts.regular,
    fontSize: typeScale.body.fontSize,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(148, 123, 179, 0.2)',
  },
  sendButton: {
    minWidth: 76,
    minHeight: 46,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
    backgroundColor: palette.lilacDeep,
  },
  sendText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.white },
  disabled: { opacity: 0.44 },
  secondaryButton: { minHeight: 42, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
});
