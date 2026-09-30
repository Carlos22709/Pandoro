import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { palette } from '@/theme/palette';

type PawToggleProps = {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
};

export function PawToggle({ checked, onPress, accessibilityLabel, size = 32 }: PawToggleProps) {
  const color = checked ? palette.greenDeep : palette.lilacDeep;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    scale.value = withSequence(withSpring(1.17, { damping: 8 }), withSpring(1));
  }, [checked, scale]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { width: size, height: size },
        checked && styles.controlChecked,
        pressed && styles.pressed,
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Svg width={size - 6} height={size - 6} viewBox="0 0 34 34">
          <Circle cx="7.5" cy="11" r="3.3" fill={checked ? color : 'none'} stroke={color} strokeWidth="1.8" opacity={checked ? 1 : 0.56} />
          <Circle cx="14.2" cy="7" r="3.5" fill={checked ? color : 'none'} stroke={color} strokeWidth="1.8" opacity={checked ? 1 : 0.56} />
          <Circle cx="21.7" cy="7.8" r="3.4" fill={checked ? color : 'none'} stroke={color} strokeWidth="1.8" opacity={checked ? 1 : 0.56} />
          <Circle cx="27.3" cy="12.6" r="3.1" fill={checked ? color : 'none'} stroke={color} strokeWidth="1.8" opacity={checked ? 1 : 0.56} />
          <Ellipse cx="17.1" cy="23" rx="9.2" ry="7.4" fill={checked ? color : 'none'} stroke={color} strokeWidth="2" opacity={checked ? 1 : 0.56} />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 123, 179, 0.22)',
    backgroundColor: 'rgba(255, 252, 245, 0.5)',
  },
  controlChecked: {
    borderColor: 'rgba(100, 139, 115, 0.34)',
    backgroundColor: 'rgba(220, 233, 207, 0.5)',
  },
  pressed: {
    opacity: 0.64,
    transform: [{ scale: 0.94 }],
  },
});
