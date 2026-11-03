import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { PandoroHead } from '@/components/art/PandoroHead';
import { AppIcon } from '@/components/icons/AppIcon';
import { AvailabilityPicker } from '@/components/planning/AvailabilityPicker';
import { ProposalEditor } from '@/components/planning/ProposalEditor';
import { TaskBottomSheet } from '@/components/tasks/TaskBottomSheet';
import { EMPTY_PLANNER, nextPriority, useTasks } from '@/components/tasks/TasksProvider';
import type { TaskDraft } from '@/components/tasks/taskTypes';
import { GeminiError, MAX_INPUT_LENGTH, planService, toGeminiError } from '@/services/gemini/geminiService';
import { analyzeProposal, proposalToTasks } from '@/services/planning/planLogic';
import type { Availability, PlanProposal } from '@/services/planning/planTypes';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

const REDISTRIBUTE_INSTRUCTION = 'Vuelve a distribuir las actividades en mis días disponibles con una carga más equilibrada.';

type PendingAction = 'generate' | 'revise';

type NewTaskScreenProps = { title?: string };

export function NewTaskScreen({ title = 'Nueva tarea' }: NewTaskScreenProps) {
  const router = useRouter();
  const { tasks, addTask, addPlannedTasks, planner, updatePlanner } = useTasks();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<GeminiError | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [manualVisible, setManualVisible] = useState(false);

  const { stage, text, days, minutesPerDay, instruction, clarification, proposal } = planner;
  const availability: Availability = { days, minutesPerDay: Number(minutesPerDay) };
  const busy = pending !== null;
  const canGenerate = !busy && text.trim().length > 0 && days.length > 0 && availability.minutesPerDay > 0;

  const issues = useMemo(
    () => (proposal ? analyzeProposal(proposal, availability) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [proposal, days, minutesPerDay],
  );
  const blocked = !proposal?.activities.length || issues.some((issue) => issue.blocking);

  const setProposal = (next: PlanProposal) => {
    updatePlanner((current) => ({ ...current, proposal: next }));
  };

  const generate = async () => {
    setPending('generate');
    setError(null);
    setLastAction(() => generate);
    setNotice(null);
    try {
      const result = await planService.generatePlan({ text: text.trim(), availability, today: new Date() });
      updatePlanner((current) => (result.kind === 'clarification'
        ? { ...current, clarification: result.question }
        : { ...current, clarification: null, proposal: result.proposal, stage: 'review' }));
    } catch (failure) {
      setError(toGeminiError(failure));
    } finally {
      setPending(null);
    }
  };

  const revise = async (request: string) => {
    if (!proposal || !request.trim()) return;
    setPending('revise');
    setError(null);
    setLastAction(() => () => revise(request));
    setNotice(null);
    try {
      const result = await planService.revisePlan({
        text: text.trim(),
        availability,
        today: new Date(),
        proposal,
        instruction: request.trim(),
      });
      if (result.kind === 'clarification') {
        updatePlanner((current) => ({ ...current, clarification: result.question }));
        return;
      }
      updatePlanner((current) => ({
        ...current,
        clarification: null,
        instruction: '',
        proposal: result.proposal,
        days: current.days.filter((day) => !result.unavailableDates.includes(day)),
      }));
      if (result.restored) {
        setNotice(`Pandoro iba a omitir ${result.restored} subtarea(s) y las conservó en la propuesta.`);
      }
    } catch (failure) {
      setError(toGeminiError(failure));
    } finally {
      setPending(null);
    }
  };

  const confirm = () => {
    if (!proposal || blocked || planner.savedProposalId === proposal.id) return;
    const savedCount = addPlannedTasks(proposalToTasks(proposal, nextPriority(tasks)));
    updatePlanner((current) => ({ ...current, stage: 'saved', savedProposalId: proposal.id, savedCount }));
  };

  const saveManualTask = (draft: TaskDraft) => {
    addTask(draft);
    setManualVisible(false);
    setNotice(`«${draft.title}» se agregó a tus tareas.`);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  const bubble = stage === 'saved'
    ? '¡Listo! Ya está en tus tareas.'
    : clarification ?? (stage === 'review' ? proposal?.summary : null) ?? 'Cuéntame qué tienes pendiente, como te salga.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <ForestScene />
      </View>
      <View pointerEvents="none" style={styles.backgroundWash} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon name="back" size={22} color={palette.lilacDeep} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.pandaRow}>
            <PandoroHead size={64} />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{bubble}</Text>
            </View>
          </View>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          {stage === 'saved' ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Plan aceptado</Text>
              <Text style={styles.statusText}>
                {planner.savedCount} tarea(s) nuevas en tu lista. Ahora puedes editarlas desde Tareas.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/tareas')}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>Ver mis tareas</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => updatePlanner(() => EMPTY_PLANNER)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Organizar algo más</Text>
              </Pressable>
            </View>
          ) : null}

          {stage !== 'saved' ? (
            <View pointerEvents={busy ? 'none' : 'auto'} style={busy && styles.dimmed}>
              {stage === 'compose' ? (
                <>
                  <Text style={styles.label}>Tus responsabilidades</Text>
                  <TextInput
                    value={text}
                    onChangeText={(value) => updatePlanner((current) => ({ ...current, text: value }))}
                    multiline
                    maxLength={MAX_INPUT_LENGTH}
                    placeholder="Tengo que preparar una exposición para el viernes y estudiar para un parcial…"
                    placeholderTextColor={palette.inkSoft}
                    accessibilityLabel="Tus responsabilidades"
                    style={styles.textArea}
                  />
                </>
              ) : null}

              {stage === 'review' && proposal ? (
                <>
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>Propuesta de Pandoro · aún no está en tus tareas</Text>
                  </View>

                  {issues.length ? (
                    <View style={styles.issues}>
                      {issues.map((issue, index) => (
                        <Text key={`${issue.kind}-${index}`} style={styles.issueText}>{issue.message}</Text>
                      ))}
                    </View>
                  ) : null}

                  <ProposalEditor proposal={proposal} days={days} onChange={setProposal} />

                  <Text style={styles.label}>¿Quieres cambiar algo?</Text>
                  <TextInput
                    value={instruction}
                    onChangeText={(value) => updatePlanner((current) => ({ ...current, instruction: value }))}
                    multiline
                    maxLength={MAX_INPUT_LENGTH}
                    placeholder="No tengo tiempo el viernes"
                    placeholderTextColor={palette.inkSoft}
                    accessibilityLabel="Pide un ajuste a Pandoro"
                    style={[styles.textArea, styles.instructionArea]}
                  />
                  <View style={styles.row}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={!instruction.trim()}
                      onPress={() => revise(instruction)}
                      style={({ pressed }) => [styles.halfButton, !instruction.trim() && styles.disabled, pressed && styles.pressed]}
                    >
                      <Text style={styles.halfButtonText}>Pedir ajuste</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => revise(REDISTRIBUTE_INSTRUCTION)}
                      style={({ pressed }) => [styles.halfButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.halfButtonText}>Redistribuir</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}

              <View style={styles.availability}>
                <AvailabilityPicker
                  days={days}
                  minutesPerDay={minutesPerDay}
                  onChangeDays={(value) => updatePlanner((current) => ({ ...current, days: value }))}
                  onChangeMinutes={(value) => updatePlanner((current) => ({ ...current, minutesPerDay: value }))}
                />
              </View>
            </View>
          ) : null}

          {busy ? (
            <View accessibilityLiveRegion="polite" style={styles.loading}>
              <ActivityIndicator color={palette.lilacDeep} />
              <Text style={styles.loadingText}>
                {pending === 'generate'
                  ? 'Pandoro está organizando tus responsabilidades…'
                  : 'Pandoro está ajustando tu propuesta…'}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View accessibilityLiveRegion="polite" style={styles.errorCard}>
              <Text style={styles.errorText}>{error.message}</Text>
              <Text style={styles.statusText}>Tu texto y tus cambios siguen aquí.</Text>
              {error.code !== 'missing_key' && lastAction ? (
                <Pressable accessibilityRole="button" onPress={lastAction} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Reintentar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {stage === 'compose' && !busy ? (
            <Pressable
              accessibilityRole="button"
              disabled={!canGenerate}
              onPress={generate}
              style={({ pressed }) => [styles.primaryButton, !canGenerate && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>Organizar con Pandoro</Text>
            </Pressable>
          ) : null}

          {stage === 'review' && !busy ? (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={blocked}
                onPress={confirm}
                style={({ pressed }) => [styles.primaryButton, blocked && styles.disabled, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>Confirmar y agregar a mis tareas</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => updatePlanner((current) => ({ ...current, stage: 'compose', proposal: null, clarification: null }))}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Descartar propuesta y volver a mi texto</Text>
              </Pressable>
            </>
          ) : null}

          {stage !== 'saved' && !busy ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setManualVisible(true)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Crear tarea manualmente</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <TaskBottomSheet
        visible={manualVisible}
        task={null}
        creating
        started={false}
        onClose={() => setManualVisible(false)}
        onToggle={() => undefined}
        onStart={() => undefined}
        onDelete={() => undefined}
        onSave={saveManualTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, overflow: 'hidden', backgroundColor: palette.sky },
  flex: { flex: 1 },
  backgroundArt: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.52 },
  backgroundWash: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: ui.surface.landscapeWash },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', gap: ui.space.md, paddingHorizontal: 20 },
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
  title: { ...typeScale.heading, color: palette.ink },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  pandaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bubble: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  bubbleText: { ...typeScale.body, fontFamily: fonts.display, lineHeight: 21, color: palette.ink },
  notice: { ...typeScale.small, fontFamily: fonts.semibold, color: palette.greenDeep, marginBottom: 10, marginLeft: 4 },
  label: { ...typeScale.caption, fontFamily: fonts.bold, color: palette.inkSoft, marginLeft: 4, marginBottom: 6 },
  textArea: {
    minHeight: 124,
    borderRadius: ui.radius.control,
    padding: 14,
    color: palette.ink,
    fontFamily: fonts.regular,
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(148, 123, 179, 0.2)',
    textAlignVertical: 'top',
  },
  instructionArea: { minHeight: 72 },
  availability: { marginTop: 16 },
  draftBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ui.radius.small,
    backgroundColor: palette.yellowSoft,
  },
  draftBadgeText: { ...typeScale.caption, fontFamily: fonts.bold, color: palette.yellowDeep },
  issues: { marginTop: 10, padding: ui.space.md, gap: 5, borderRadius: ui.radius.card, backgroundColor: palette.pinkSoft },
  issueText: { ...typeScale.small, fontFamily: fonts.semibold, color: palette.ink },
  row: { flexDirection: 'row', gap: ui.space.sm, marginTop: ui.space.sm },
  halfButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(120, 95, 111, 0.1)',
  },
  halfButtonText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: ui.space.md, borderRadius: ui.radius.card, backgroundColor: palette.lilacSoft },
  loadingText: { ...typeScale.small, fontFamily: fonts.semibold, flex: 1, color: palette.ink },
  errorCard: { marginTop: 16, padding: ui.space.md, gap: 4, borderRadius: ui.radius.card, backgroundColor: palette.pinkSoft },
  errorText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.ink },
  statusCard: { padding: ui.space.lg, borderRadius: ui.radius.card, backgroundColor: 'rgba(255, 252, 245, 0.95)', borderWidth: 1, borderColor: ui.surface.border },
  statusTitle: { ...typeScale.heading, color: palette.ink },
  statusText: { ...typeScale.small, color: palette.inkSoft, marginTop: 2 },
  primaryButton: {
    minHeight: 50,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.lilacDeep,
  },
  primaryText: { ...typeScale.body, fontFamily: fonts.bold, lineHeight: 20, color: palette.white },
  secondaryButton: { minHeight: 42, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  disabled: { opacity: 0.44 },
  dimmed: { opacity: 0.6 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
