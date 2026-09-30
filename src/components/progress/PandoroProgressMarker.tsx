import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Pandoro } from '@/components/art/Pandoro';
import { PROGRESS_WORLD_WIDTH, getLandmarkZoom } from '@/components/progress/worldData';

type WorldPoint = { x: number; y: number };

type PandoroProgressMarkerProps = WorldPoint & {
  worldWidth: number;
  // Si llega, Pandoro camina por el sendero desde (x, y) hasta este lugar.
  walkTo?: WorldPoint;
  walkDuration?: number;
};

const MARKER_WIDTH = 126;
const MARKER_HEIGHT = 144;
const HOPS = 6;

export function PandoroProgressMarker({
  x,
  y,
  worldWidth,
  walkTo,
  walkDuration = 2600,
}: PandoroProgressMarkerProps) {
  const scale = worldWidth / PROGRESS_WORLD_WIDTH;
  const zoom = getLandmarkZoom(worldWidth);
  const walk = useSharedValue(0);
  const target = walkTo ?? { x, y };
  const walking = walkTo !== undefined;

  useEffect(() => {
    if (!walking) return;
    walk.value = 0;
    walk.value = withTiming(1, { duration: walkDuration, easing: Easing.inOut(Easing.quad) });
  }, [walk, walking, walkDuration]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = walk.value;
    const inverse = 1 - t;
    // Misma curva que el sendero de ProgressPath: sube, cruza y vuelve a subir.
    const middleY = (y + target.y) / 2;
    const pointX = inverse ** 3 * x + 3 * inverse ** 2 * t * x + 3 * inverse * t ** 2 * target.x + t ** 3 * target.x;
    const pointY = inverse ** 3 * y + 3 * inverse ** 2 * t * middleY + 3 * inverse * t ** 2 * middleY + t ** 3 * target.y;
    const left = Math.min(
      worldWidth - MARKER_WIDTH,
      Math.max(0, pointX * scale - MARKER_WIDTH / 2 + 40 * zoom * scale),
    );
    const hop = t > 0 && t < 1 ? Math.abs(Math.sin(t * Math.PI * HOPS)) * 9 : 0;

    return {
      transform: [
        { translateX: left },
        { translateY: pointY - MARKER_HEIGHT - 18 * zoom - hop },
        { rotate: `${Math.sin(t * Math.PI * HOPS * 2) * (t < 1 ? 3 : 0)}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLabel={walkTo ? 'Pandoro camina hacia el nuevo lugar' : 'Pandoro está en la ubicación actual'}
      style={[styles.container, animatedStyle]}
    >
      <Pandoro size={108} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MARKER_WIDTH,
    height: MARKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 7,
  },
});
