import { StyleSheet, View } from 'react-native';

import { palette } from '@/theme/palette';

type PaginationDotsProps = {
  activeIndex: number;
  total?: number;
};

export function PaginationDots({ activeIndex, total = 4 }: PaginationDotsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Progreso del onboarding"
      accessibilityValue={{ min: 1, max: total, now: activeIndex + 1 }}
      style={styles.container}
    >
      {Array.from({ length: total }, (_, index) => {
        const active = index === activeIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: active ? 18 : 6,
                backgroundColor: active ? palette.lilacDeep : palette.lilacSoft,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
