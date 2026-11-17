import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pandoro } from '@/components/art/Pandoro';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import { useTasks } from '@/components/tasks/TasksProvider';
import type { TaskItem } from '@/components/tasks/taskTypes';
import { PROGRESS_WORLD_STAGES } from '@/components/progress/worldData';
import { useDemo } from '@/demo/DemoProvider';
import { dayNumber, formatDay, toIsoDate, upcomingDays, weekdayShort } from '@/services/planning/planDates';
import { carryOverTasks, closureSummary } from '@/services/progress/weekClosure';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

const MOVE_DAYS = 7;

// Cierre de semana: lo ganado primero (si hubo algo), después lo que sigue. Nada se pierde ni se bloquea.
// «Pasar todo» y salir sin elegir hacen lo mismo: reconocer el cierre sin tocar ninguna tarea.
export function WeekClosureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { tasks, events, dismissTask, moveDueDate } = useTasks();
  const { progress, acknowledgeClosure } = useDemo();
  const today = useMemo(() => new Date(), []);
  // El resumen se fija al abrir: ajustar tareas no cambia lo que ya ganaste.
  const [summary] = useState(() => closureSummary(
    events,
    tasks,
    { lastAcknowledgedWeekKey: progress.lastAcknowledgedWeekKey, unlockedWeeks: progress.unlockedWeeks },
    today,
  ));
  // El lugar que abre la semana ganada (si el mundo todavía tiene uno más adelante).
  const [newPlace] = useState(() => {
    const won = summary?.wonWeeks.length ?? 0;
    if (!won) return null;
    const reached = Math.min(PROGRESS_WORLD_STAGES.length, progress.currentStage + won);
    return reached > progress.currentStage
      ? PROGRESS_WORLD_STAGES.find((stage) => stage.id === reached)?.title ?? null
      : null;
  });
  const [listOpen, setListOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const pending = useMemo(() => carryOverTasks(tasks, today), [tasks, today]);
  const days = useMemo(() => upcomingDays(today, MOVE_DAYS), [today]);

  // Cerrar la pantalla de cualquier forma (botón, gesto atrás) reconoce el cierre una sola vez.
  const wonWeeks = summary?.wonWeeks ?? [];
  const acknowledgeRef = useRef(() => acknowledgeClosure(today, wonWeeks));
  acknowledgeRef.current = () => acknowledgeClosure(today, wonWeeks);
  useEffect(() => () => acknowledgeRef.current(), []);

  const finish = () => {
    acknowledgeClosure(today, wonWeeks);
    if (router.canGoBack()) router.back();
    else router.replace('/inicio');
  };

  const seeWorld = () => {
    acknowledgeClosure(today, wonWeeks);
    router.navigate('/progreso');
  };

  const move = (task: TaskItem, day: string) => {
    moveDueDate(task.id, day);
    setMovingId(null);
  };

  const gainedSteps = summary?.steps ?? 0;
  const weekWon = wonWeeks.length > 0;

  return (
    // Aviso sobre la app, no una pantalla completa. No se cierra tocando fuera para que un toque
    // nervioso no lo haga desaparecer; el gesto atrás equivale a «Pasar todo».
    <View style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.stack} accessibilityViewIsModal>
        <View pointerEvents="none" style={styles.mascot}>
          <Pandoro size={110} />
        </View>
        <View style={[styles.dialog, { maxHeight: Math.max(280, height - insets.top - insets.bottom - 120) }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Una semana nueva</Text>

        {gainedSteps > 0 ? (
          <View style={styles.card} accessibilityLabel={weekWon ? 'Semana completada' : 'Tus tareas completadas'}>
            <Text style={styles.cardTitle}>
              {weekWon ? (wonWeeks.length > 1 ? 'Semanas completadas' : 'Semana completada') : 'Tu semana'}
            </Text>
            <Text style={styles.big}>
              {gainedSteps} {gainedSteps === 1 ? 'tarea completada' : 'tareas completadas'}
            </Text>
            <Text style={styles.body}>
              {newPlace ? 'Se abrió un nuevo lugar en tu mundo:' : 'Pandoro avanzó por el camino contigo.'}
            </Text>
            {newPlace ? <Text style={styles.place}>{newPlace}</Text> : null}
          </View>
        ) : null}

        {pending.length > 0 ? (
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              aria-expanded={listOpen}
              accessibilityLabel={`Para la próxima semana, ${pending.length} ${pending.length === 1 ? 'tarea' : 'tareas'}`}
              onPress={() => setListOpen((open) => !open)}
              style={({ pressed }) => [styles.foldHeader, pressed && styles.pressed]}
            >
              <Text style={styles.cardTitle}>Para la próxima semana</Text>
              <Text style={styles.count}>{pending.length}</Text>
              <Text style={styles.chevron}>{listOpen ? '–' : '+'}</Text>
            </Pressable>

            {listOpen ? (
              <View style={styles.list}>
                {pending.map((task) => (
                  <View key={task.id} style={styles.item}>
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle}>{task.title}</Text>
                      {task.dueDate ? <Text style={styles.itemDate}>{formatDay(task.dueDate)}</Text> : null}
                    </View>
                    {adjusting ? (
                      <View style={styles.actions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Mover la fecha de ${task.title}`}
                          onPress={() => setMovingId(movingId === task.id ? null : task.id)}
                          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                        >
                          <Text style={styles.chipLabel}>Mover fecha</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Ya no aplica: ${task.title}`}
                          onPress={() => dismissTask(task.id)}
                          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                        >
                          <Text style={styles.chipLabel}>Ya no aplica</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {adjusting && movingId === task.id ? (
                      <View style={styles.days}>
                        {days.map((day) => (
                          <Pressable
                            key={day}
                            accessibilityRole="button"
                            accessibilityLabel={`Mover a ${formatDay(day)}`}
                            onPress={() => move(task, day)}
                            style={({ pressed }) => [styles.day, day === toIsoDate(today) && styles.dayToday, pressed && styles.pressed]}
                          >
                            <Text style={styles.dayName}>{weekdayShort(day)}</Text>
                            <Text style={styles.dayNumber}>{dayNumber(day)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.buttons}>
          {newPlace ? <PrimaryButton label="Ver mi mundo" onPress={seeWorld} /> : null}
          <PrimaryButton
            label={pending.length > 0 ? 'Pasar todo' : 'Continuar'}
            variant={newPlace ? 'soft' : 'filled'}
            onPress={finish}
          />
          {pending.length > 0 && !adjusting ? (
            <PrimaryButton
              label="Ajustar una por una"
              variant="soft"
              onPress={() => {
                setAdjusting(true);
                setListOpen(true);
              }}
            />
          ) : null}
        </View>
      </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(61, 49, 67, 0.3)',
  },
  stack: { width: '100%', maxWidth: 360, alignItems: 'center' },
  mascot: { marginBottom: -30, zIndex: 2 },
  dialog: {
    width: '100%',
    borderRadius: ui.radius.panel,
    backgroundColor: ui.surface.base,
    borderWidth: 1,
    borderColor: ui.surface.border,
    paddingTop: 34,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  content: { paddingHorizontal: 18, paddingBottom: 18, gap: 12 },
  title: { ...typeScale.heading, color: palette.ink, textAlign: 'center' },
  card: {
    borderRadius: ui.radius.card,
    backgroundColor: palette.creamStrong,
    padding: 14,
    gap: 6,
  },
  cardTitle: { ...typeScale.body, fontFamily: fonts.bold, color: palette.ink, flex: 1 },
  big: { ...typeScale.heading, color: palette.greenDeep },
  body: { ...typeScale.small, color: palette.inkSoft },
  place: { ...typeScale.body, fontFamily: fonts.bold, color: palette.greenDeep },
  foldHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: ui.size.touch },
  count: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  chevron: { ...typeScale.heading, color: palette.lilacDeep, width: 20, textAlign: 'center' },
  list: { gap: 10, marginTop: 4 },
  item: {
    gap: 8,
    borderRadius: ui.radius.card,
    backgroundColor: palette.creamStrong,
    padding: 12,
  },
  itemText: { gap: 2 },
  itemTitle: { ...typeScale.small, fontFamily: fonts.semibold, color: palette.ink },
  itemDate: { ...typeScale.caption, color: palette.inkSoft },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minHeight: ui.size.touch,
    paddingHorizontal: 14,
    borderRadius: ui.radius.round,
    backgroundColor: palette.lilacSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: {
    minWidth: 40,
    flexGrow: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.small,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  dayToday: { borderColor: palette.lilac },
  dayName: { ...typeScale.caption, fontFamily: fonts.semibold, color: palette.inkSoft },
  dayNumber: { ...typeScale.small, fontFamily: fonts.bold, color: palette.ink },
  buttons: { gap: 10, marginTop: 6 },
  pressed: { opacity: 0.78 },
});
