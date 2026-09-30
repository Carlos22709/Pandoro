import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/icons/AppIcon';
import { PawToggle } from '@/components/tasks/PawToggle';
import {
  TASK_DIFFICULTY,
  type TaskDifficulty,
  type TaskDraft,
  type TaskItem,
} from '@/components/tasks/taskTypes';
import { palette, toneColors } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';

type TaskBottomSheetProps = {
  visible: boolean;
  task: TaskItem | null;
  creating: boolean;
  started: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (draft: TaskDraft) => void;
};

export function TaskBottomSheet({
  visible,
  task,
  creating,
  started,
  onClose,
  onToggle,
  onStart,
  onDelete,
  onSave,
}: TaskBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [duration, setDuration] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');

  useEffect(() => {
    if (!visible) return;
    setEditing(creating);
    setTitle(task?.title ?? '');
    setDetail(task?.detail ?? 'Hoy · 30 min');
    setDuration(task?.duration ?? '30 min');
    setDifficulty(task?.difficulty ?? 'medium');
  }, [creating, task, visible]);

  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onSave({
      title: cleanTitle,
      detail: detail.trim() || 'Sin fecha',
      duration: duration.trim() || undefined,
      difficulty,
    });
    if (!creating) setEditing(false);
  };

  const activeDifficulty = TASK_DIFFICULTY[task?.difficulty ?? difficulty];
  const activeDifficultyColors = toneColors[activeDifficulty.tone];
  const colors = activeDifficultyColors;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar detalle de tarea"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.keyboardArea}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 8 }]}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <View style={[styles.headerIcon, { backgroundColor: colors.soft }]}>
                <AppIcon
                  name={creating ? 'plus' : task?.icon ?? 'checklist'}
                  color={colors.deep}
                  size={25}
                  strokeWidth={2.35}
                />
              </View>
              <Text style={styles.eyebrow}>{creating ? 'Nueva tarea' : editing ? 'Editar tarea' : 'Detalle'}</Text>
              <Pressable accessibilityLabel="Cerrar" hitSlop={8} onPress={onClose} style={styles.closeButton}>
                <AppIcon name="close" color={palette.inkSoft} size={20} />
              </Pressable>
            </View>

            {editing ? (
              <View style={styles.form}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  autoFocus={creating}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nombre de la tarea"
                  placeholderTextColor={palette.inkSoft}
                  style={styles.input}
                />
                <View style={styles.fieldRow}>
                  <View style={styles.fieldColumn}>
                    <Text style={styles.inputLabel}>Fecha u hora</Text>
                    <TextInput
                      value={detail}
                      onChangeText={setDetail}
                      placeholder="Hoy · 5:00 p. m."
                      placeholderTextColor={palette.inkSoft}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.fieldColumnSmall}>
                    <Text style={styles.inputLabel}>Duración</Text>
                    <TextInput
                      value={duration}
                      onChangeText={setDuration}
                      placeholder="30 min"
                      placeholderTextColor={palette.inkSoft}
                      style={styles.input}
                    />
                  </View>
                </View>
                <Text style={[styles.inputLabel, styles.difficultyLabel]}>Dificultad</Text>
                <View style={styles.difficultyOptions}>
                  {(Object.keys(TASK_DIFFICULTY) as TaskDifficulty[]).map((level) => {
                    const option = TASK_DIFFICULTY[level];
                    const optionColors = toneColors[option.tone];
                    const selected = difficulty === level;
                    return (
                      <Pressable
                        key={level}
                        onPress={() => setDifficulty(level)}
                        style={({ pressed }) => [
                          styles.difficultyOption,
                          selected && {
                            backgroundColor: optionColors.soft,
                            borderColor: optionColors.main,
                          },
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <View style={[styles.difficultyDot, { backgroundColor: optionColors.deep }]} />
                        <Text style={[styles.difficultyOptionText, selected && { color: optionColors.deep }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!title.trim()}
                  onPress={save}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    !title.trim() && styles.disabledButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>{creating ? 'Crear tarea' : 'Guardar cambios'}</Text>
                </Pressable>
                {!creating ? (
                  <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : task ? (
              <>
                <View style={styles.taskSummary}>
                  <View style={styles.summaryCopy}>
                    <Text style={[styles.taskTitle, task.completed && styles.completedTitle]}>{task.title}</Text>
                    <Text style={styles.taskMeta}>{task.detail}</Text>
                    {task.duration ? <Text style={styles.duration}>Duración estimada · {task.duration}</Text> : null}
                    <View style={styles.summaryDifficulty}>
                      <View style={[styles.difficultyDot, { backgroundColor: activeDifficultyColors.deep }]} />
                      <Text style={[styles.summaryDifficultyText, { color: activeDifficultyColors.deep }]}>
                        Dificultad {activeDifficulty.label.toLowerCase()}
                      </Text>
                    </View>
                  </View>
                  <PawToggle
                    checked={task.completed}
                    onPress={() => onToggle(task.id)}
                    accessibilityLabel={task.completed ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`}
                    size={45}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => onStart(task.id)}
                  style={({ pressed }) => [styles.primaryButton, started && styles.startedButton, pressed && styles.buttonPressed]}
                >
                  <AppIcon name="play" color={palette.white} size={20} strokeWidth={2.7} />
                  <Text style={styles.primaryButtonText}>{started ? 'En curso' : 'Empezar'}</Text>
                </Pressable>

                <View style={styles.secondaryActions}>
                  <Pressable onPress={() => setEditing(true)} style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}>
                    <AppIcon name="edit" color={palette.lilacDeep} size={21} />
                    <Text style={styles.editText}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => onDelete(task.id)} style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}>
                    <AppIcon name="trash" color={palette.pinkDeep} size={21} />
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(61, 49, 67, 0.24)' },
  keyboardArea: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    paddingHorizontal: 22,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(120, 95, 111, 0.13)',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: { alignSelf: 'center', width: 45, height: 5, borderRadius: 3, backgroundColor: palette.lilac, opacity: 0.75, marginBottom: 14 },
  sheetHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...typeScale.small, fontFamily: fonts.bold, flex: 1, color: palette.inkSoft },
  closeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  taskSummary: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 20 },
  summaryCopy: { flex: 1 },
  taskTitle: { ...typeScale.heading, color: palette.ink },
  completedTitle: { textDecorationLine: 'line-through', color: palette.inkSoft },
  taskMeta: { ...typeScale.body, fontFamily: fonts.semibold, marginTop: 7, color: palette.inkSoft },
  duration: { ...typeScale.small, fontFamily: fonts.semibold, marginTop: 4, color: palette.greenDeep },
  summaryDifficulty: { alignSelf: 'flex-start', minHeight: 18, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  summaryDifficultyText: { ...typeScale.caption, fontFamily: fonts.semibold },
  primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lilacDeep },
  startedButton: { backgroundColor: palette.greenDeep },
  primaryButtonText: { ...typeScale.body, fontFamily: fonts.bold, lineHeight: 20, color: palette.white },
  disabledButton: { opacity: 0.44 },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  secondaryActions: { flexDirection: 'row', gap: 10, marginTop: 11 },
  actionButton: { flex: 1, minHeight: 46, borderRadius: 12, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.white, borderWidth: 1, borderColor: 'rgba(120, 95, 111, 0.1)' },
  editText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  deleteText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.pinkDeep },
  form: { paddingTop: 17 },
  inputLabel: { ...typeScale.caption, fontFamily: fonts.bold, color: palette.inkSoft, marginLeft: 4, marginBottom: 6 },
  input: { minHeight: 48, borderRadius: 12, paddingHorizontal: 15, color: palette.ink, fontFamily: fonts.semibold, fontSize: typeScale.body.fontSize, backgroundColor: palette.white, borderWidth: 1, borderColor: 'rgba(148, 123, 179, 0.2)' },
  fieldRow: { flexDirection: 'row', gap: 10, marginTop: 13 },
  fieldColumn: { flex: 1.45 },
  fieldColumnSmall: { flex: 0.8 },
  difficultyLabel: { marginTop: 14 },
  difficultyOptions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  difficultyOption: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: palette.white, borderWidth: 1, borderColor: 'rgba(117, 101, 127, 0.12)' },
  difficultyDot: { width: 7, height: 7, borderRadius: 4 },
  difficultyOptionText: { ...typeScale.caption, fontFamily: fonts.semibold, color: palette.inkSoft },
  cancelButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.inkSoft },
});
