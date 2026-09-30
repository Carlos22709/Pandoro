import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

export function ProgressWidget() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso de tu espacio"
      accessibilityValue={{ min: 0, max: 100, now: 58 }}
      style={styles.container}
    >
      <AppIcon name="sprout" size={20} color={palette.greenDeep} strokeWidth={2.2} />
      <View style={styles.track}>
        <View style={styles.fill} />
      </View>
      <Text style={styles.value}>58%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 132,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: ui.radius.control,
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderWidth: 1,
    borderColor: ui.surface.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 5,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: palette.creamStrong,
  },
  fill: {
    width: '58%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.green,
  },
  value: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
});
