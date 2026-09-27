import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/icons/AppIcon';
import { palette } from '@/theme/palette';

export function ProgressWidget() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso de tu espacio"
      accessibilityValue={{ min: 0, max: 100, now: 58 }}
      style={styles.container}
    >
      <View pointerEvents="none" style={styles.wash} />
      <AppIcon name="sprout" size={28} color={palette.greenDeep} strokeWidth={2.2} />
      <View style={styles.track}>
        <View style={styles.fill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 112,
    height: 64,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 25,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(166, 136, 126, 0.12)',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    top: -7,
    left: -9,
    width: 72,
    height: 39,
    borderRadius: 23,
    backgroundColor: palette.greenSoft,
    opacity: 0.42,
    transform: [{ rotate: '-7deg' }],
  },
  track: {
    width: 74,
    height: 7,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#F1E2D6',
    borderWidth: 1,
    borderColor: 'rgba(100, 139, 115, 0.12)',
  },
  fill: {
    width: '58%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: palette.green,
  },
});
