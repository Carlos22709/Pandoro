import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';

type ProgressSummaryProps = {
  streak: number;
  completedTasks: number;
};

export function ProgressSummary({ streak, completedTasks }: ProgressSummaryProps) {
  const accessibilityLabel = streak + ' días seguidos, ' + completedTasks + ' tareas';

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <View style={styles.dot} />
      <Text style={styles.text}>{streak} días seguidos · {completedTasks} tareas</Text>
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
