import { StyleSheet, View } from 'react-native';

import { type PaletteTone, toneColors } from '@/theme/palette';

type PaginationDotsProps = {
  activeIndex: number;
  total?: number;
  tone: Extract<PaletteTone, 'pink' | 'lilac' | 'blue' | 'yellow'>;
};

export function PaginationDots({ activeIndex, total = 4, tone }: PaginationDotsProps) {
  const colors = toneColors[tone];

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
                width: active ? 24 : 8,
                backgroundColor: active ? colors.deep : colors.soft,
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
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
