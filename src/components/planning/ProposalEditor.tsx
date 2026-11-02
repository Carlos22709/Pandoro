import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { TASK_DIFFICULTY, type TaskDifficulty } from '@/components/tasks/taskTypes';
import { formatDay, formatMinutes } from '@/services/planning/planDates';
import {
  activityMinutes,
  addSubtask,
  planByDay,
  removeActivity,
  removeSubtask,
  updateActivity,
  updateSubtask,
} from '@/services/planning/planLogic';
import type { PlanActivity, PlanProposal, PlanSubtask } from '@/services/planning/planTypes';
import { palette, toneColors } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

const PRIORITY_LABELS = { high: 'alta', medium: 'media', low: 'baja' } as const;

type DifficultyPickerProps = {
  value: TaskDifficulty;
  onChange: (value: TaskDifficulty) => void;
};

function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <View style={styles.options}>
      {(Object.keys(TASK_DIFFICULTY) as TaskDifficulty[]).map((level) => {
        const option = TASK_DIFFICULTY[level];
        const colors = toneColors[option.tone];
        const selected = value === level;
        return (
          <Pressable
            key={level}
            accessibilityRole="radio"
            aria-checked={selected}
            onPress={() => onChange(level)}
            style={[styles.option, selected && { backgroundColor: colors.soft, borderColor: colors.main }]}
          >
            <View style={[styles.dot, { backgroundColor: colors.deep }]} />
            <Text style={[styles.optionText, selected && { color: colors.deep }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SubtaskEditorProps = {
  subtask: PlanSubtask;
  days: string[];
  onChange: (patch: Parameters<typeof updateSubtask>[2]) => void;
  onRemove: () => void;
};

function SubtaskEditor({ subtask, days, onChange, onRemove }: SubtaskEditorProps) {
  const edited = subtask.editedFields.includes('durationMinutes') || subtask.editedFields.includes('difficulty');
  // Un día que ya no está disponible se sigue mostrando para que el conflicto sea visible.
  const dayOptions = subtask.scheduledDate && !days.includes(subtask.scheduledDate)
    ? [subtask.scheduledDate, ...days]
    : days;

  return (
    <View style={styles.subtask}>
      <View style={styles.subtaskHeader}>
        <TextInput
          value={subtask.title}
          onChangeText={(title) => onChange({ title })}
          placeholder="Nombre de la subtarea"
          placeholderTextColor={palette.inkSoft}
          accessibilityLabel="Nombre de la subtarea"
          style={[styles.input, styles.flexInput]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${subtask.title || 'subtarea'}`}
          onPress={onRemove}
          hitSlop={6}
          style={styles.iconButton}
        >
          <AppIcon name="trash" color={palette.pinkDeep} size={19} />
        </Pressable>
      </View>
      <TextInput
        value={subtask.description}
        onChangeText={(description) => onChange({ description })}
        placeholder="Descripción"
        placeholderTextColor={palette.inkSoft}
        accessibilityLabel="Descripción de la subtarea"
        multiline
        style={[styles.input, styles.description]}
      />
      <View style={styles.durationRow}>
        <TextInput
          value={subtask.durationMinutes ? String(subtask.durationMinutes) : ''}
          onChangeText={(value) => onChange({ durationMinutes: Number(value.replace(/\D/g, '')) })}
          keyboardType="number-pad"
          placeholder="30"
          placeholderTextColor={palette.inkSoft}
          accessibilityLabel="Duración en minutos"
          style={[styles.input, styles.durationInput]}
        />
        <Text style={styles.hint}>{edited ? 'min · ajustado por ti' : 'min · estimación de Pandoro'}</Text>
      </View>
      <DifficultyPicker value={subtask.difficulty} onChange={(difficulty) => onChange({ difficulty })} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayOptions}>
        {dayOptions.map((day) => {
          const selected = subtask.scheduledDate === day;
          return (
            <Pressable
              key={day}
              accessibilityRole="radio"
              aria-checked={selected}
              onPress={() => onChange({ scheduledDate: selected ? null : day })}
              style={[styles.dayChip, selected && styles.dayChipSelected]}
            >
              <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{formatDay(day)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

type ActivityEditorProps = {
  activity: PlanActivity;
  proposal: PlanProposal;
  days: string[];
  onChange: (proposal: PlanProposal) => void;
  createId: () => string;
};

function ActivityEditor({ activity, proposal, days, onChange, createId }: ActivityEditorProps) {
  return (
    <View style={styles.card}>
      <View style={styles.subtaskHeader}>
        <TextInput
          value={activity.title}
          onChangeText={(title) => onChange(updateActivity(proposal, activity.id, { title }))}
          placeholder="Nombre de la actividad"
          placeholderTextColor={palette.inkSoft}
          accessibilityLabel="Nombre de la actividad"
          style={[styles.input, styles.flexInput, styles.activityTitle]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${activity.title || 'actividad'}`}
          onPress={() => onChange(removeActivity(proposal, activity.id))}
          hitSlop={6}
          style={styles.iconButton}
        >
          <AppIcon name="trash" color={palette.pinkDeep} size={20} />
        </Pressable>
      </View>
      <TextInput
        value={activity.description}
        onChangeText={(description) => onChange(updateActivity(proposal, activity.id, { description }))}
        placeholder="Descripción"
        placeholderTextColor={palette.inkSoft}
        accessibilityLabel="Descripción de la actividad"
        multiline
        style={[styles.input, styles.description]}
      />
      <Text style={styles.meta}>
        {activity.deadline ? `Fecha límite que indicaste: ${formatDay(activity.deadline)}` : 'Sin fecha límite indicada'}
      </Text>
      <Text style={styles.meta}>
        Prioridad {PRIORITY_LABELS[activity.priority]}
        {activity.prioritySource === 'inferred' ? ' (inferida por Pandoro)' : ''}
        {' · '}≈ {formatMinutes(activityMinutes(activity))} en total
      </Text>
      <Text style={styles.fieldLabel}>Dificultad de la actividad</Text>
      <DifficultyPicker
        value={activity.difficulty}
        onChange={(difficulty) => onChange(updateActivity(proposal, activity.id, { difficulty }))}
      />
      {activity.subtasks.map((subtask) => (
        <SubtaskEditor
          key={subtask.id}
          subtask={subtask}
          days={days}
          onChange={(patch) => onChange(updateSubtask(proposal, subtask.id, patch))}
          onRemove={() => onChange(removeSubtask(proposal, subtask.id))}
        />
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(addSubtask(proposal, activity.id, createId()))}
        style={({ pressed }) => [styles.addSubtask, pressed && styles.pressed]}
      >
        <AppIcon name="plus" color={palette.lilacDeep} size={19} strokeWidth={2.5} />
        <Text style={styles.addSubtaskText}>Agregar subtarea</Text>
      </Pressable>
    </View>
  );
}

type ProposalEditorProps = {
  proposal: PlanProposal;
  days: string[];
  onChange: (proposal: PlanProposal) => void;
};

export function ProposalEditor({ proposal, days, onChange }: ProposalEditorProps) {
  const createId = () => `manual-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  return (
    <View>
      <Text style={styles.sectionTitle}>Tu semana propuesta</Text>
      <View style={styles.card}>
        {planByDay(proposal).map((day) => (
          <View key={day.date ?? 'sin-dia'} style={styles.dayBlock}>
            <Text style={styles.dayTitle}>
              {day.date ? formatDay(day.date) : 'Sin día asignado'} · ≈ {formatMinutes(day.minutes)}
            </Text>
            {day.items.map(({ activity, subtask }) => (
              <Text key={subtask.id} style={styles.dayItem}>
                {subtask.order}. {subtask.title || 'Sin nombre'} · {activity.title} · ≈ {formatMinutes(subtask.durationMinutes)} · {TASK_DIFFICULTY[subtask.difficulty].label}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Ajusta los detalles</Text>
      {proposal.activities.map((activity) => (
        <ActivityEditor
          key={activity.id}
          activity={activity}
          proposal={proposal}
          days={days}
          onChange={onChange}
          createId={createId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typeScale.body, fontFamily: fonts.display, color: palette.ink, marginTop: 16, marginBottom: 8, marginLeft: 4 },
  card: {
    padding: ui.space.md,
    marginBottom: ui.space.md,
    borderRadius: ui.radius.card,
    backgroundColor: 'rgba(255, 252, 245, 0.95)',
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  dayBlock: { paddingVertical: 5 },
  dayTitle: { ...typeScale.small, fontFamily: fonts.bold, color: palette.ink },
  dayItem: { ...typeScale.caption, color: palette.inkSoft, marginTop: 3 },
  subtask: { marginTop: 10, padding: 10, borderRadius: ui.radius.control, backgroundColor: palette.cream, gap: 7 },
  subtaskHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: palette.ink,
    fontFamily: fonts.semibold,
    fontSize: typeScale.small.fontSize,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(148, 123, 179, 0.2)',
  },
  flexInput: { flex: 1, minWidth: 0 },
  activityTitle: { fontFamily: fonts.bold, fontSize: typeScale.body.fontSize },
  description: { marginTop: 6, paddingVertical: 8, fontFamily: fonts.regular, textAlignVertical: 'top' },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  durationInput: { width: 70 },
  hint: { ...typeScale.caption, flex: 1, color: palette.inkSoft },
  meta: { ...typeScale.caption, fontFamily: fonts.semibold, color: palette.inkSoft, marginTop: 6, marginLeft: 2 },
  fieldLabel: { ...typeScale.caption, fontFamily: fonts.bold, color: palette.inkSoft, marginTop: 10, marginBottom: 5, marginLeft: 2 },
  options: { flexDirection: 'row', gap: 6 },
  option: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.12)',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  optionText: { ...typeScale.caption, fontFamily: fonts.semibold, color: palette.inkSoft },
  dayOptions: { gap: 6 },
  dayChip: {
    minHeight: 32,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: ui.radius.small,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.12)',
  },
  dayChipSelected: { backgroundColor: palette.lilacSoft, borderColor: palette.lilac },
  dayChipText: { ...typeScale.caption, fontFamily: fonts.semibold, color: palette.inkSoft },
  dayChipTextSelected: { color: palette.lilacDeep },
  addSubtask: { minHeight: 42, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addSubtaskText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  pressed: { opacity: 0.72 },
});
