import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/icons/AppIcon';
import type { ProgressWorldStage } from '@/components/progress/worldData';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type ProgressLandmarkSheetProps = {
  stage: ProgressWorldStage | null;
  completedTasks: number;
  onClose: () => void;
};

export function ProgressLandmarkSheet({
  stage,
  completedTasks,
  onClose,
}: ProgressLandmarkSheetProps) {
  const insets = useSafeAreaInsets();

  if (!stage) return null;

  const stateLabel = stage.status === 'completed'
    ? 'Lugar recorrido'
    : stage.status === 'current'
      ? 'Ubicación actual'
      : stage.isNext
        ? 'Próxima parada'
        : 'Por descubrir';

  const progressCopy = stage.status === 'completed'
    ? 'Este lugar ya floreció como parte de tu viaje.'
    : stage.status === 'current'
      ? completedTasks + ' / ' + stage.goalTasks + ' tareas'
      : stage.isNext
        ? 'Te faltan ' + stage.remainingTasks + ' tareas para llegar aquí.'
        : 'Llegarás aquí al completar ' + stage.requiredTasks + ' tareas.';

  const stateColor = stage.status === 'completed'
    ? palette.greenDeep
    : stage.status === 'current'
      ? palette.lilacDeep
      : stage.isNext
        ? palette.yellowDeep
        : palette.inkSoft;

  return (
    <Modal
      animationType="slide"
      transparent
      visible
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar información del lugar"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.stateRow}>
            <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
            <Text style={[styles.state, { color: stateColor }]}>{stateLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <AppIcon name="close" color={palette.inkSoft} size={19} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Text style={styles.title}>{stage.title}</Text>
          <Text style={styles.description}>{stage.description}</Text>
          <View style={styles.divider} />
          <Text style={[styles.progress, { color: stateColor }]}>{progressCopy}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(61, 49, 67, 0.22)',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: ui.space.xl,
    paddingTop: 10,
    borderTopLeftRadius: ui.radius.panel,
    borderTopRightRadius: ui.radius.panel,
    backgroundColor: ui.surface.base,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  handle: {
    width: 40,
    height: 4,
    marginBottom: 14,
    alignSelf: 'center',
    borderRadius: 2,
    backgroundColor: palette.lilac,
  },
  stateRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  state: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    flex: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.small,
  },
  pressed: {
    opacity: 0.65,
  },
  title: {
    ...typeScale.heading,
    marginTop: 7,
    color: palette.ink,
  },
  description: {
    ...typeScale.small,
    lineHeight: 21,
    maxWidth: 390,
    marginTop: 8,
    color: palette.inkSoft,
  },
  divider: {
    height: 1,
    marginTop: 16,
    backgroundColor: ui.surface.border,
  },
  progress: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    marginTop: 13,
  },
});
