import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';

type ProgressSummaryProps = {
  completedTasks: number;
  completedWeeks: number;
};

// Solo cuenta lo ganado: ningún contador se reinicia por inactividad.
export function ProgressSummary({ completedTasks, completedWeeks }: ProgressSummaryProps) {
  const accessibilityLabel = completedTasks + ' tareas completadas, ' + completedWeeks + ' semanas completadas';

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <View style={styles.dot} />
      <Text style={styles.text}>{completedTasks} tareas completadas · {completedWeeks} semanas completadas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.greenDeep,
  },
  text: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
});
