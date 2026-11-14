import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { Pandoro } from '@/components/art/Pandoro';
import { PROGRESS_WORLD_WIDTH, getLandmarkZoom } from '@/components/progress/worldData';
import { trailPoint, type TrailPoint } from '@/services/progress/pandaPath';
import { palette } from '@/theme/palette';

type PandoroProgressMarkerProps = {
  worldWidth: number;
  // Lugar actual y siguiente: Pandoro va por el sendero que los une.
  from: TrailPoint;
  to?: TrailPoint;
  // Posición en el sendero (0 = en el lugar actual, 1 = en el siguiente). Si cambian, camina de una a otra.
  startT?: number;
  endT?: number;
  duration?: number;
  // Pasos del recorrido; más largo, más pasos (por defecto 6).
  hops?: number;
  // Cambia para repetir el recorrido aunque las posiciones sean las mismas.
  animationKey?: number;
};

const MARKER_WIDTH = 126;
const MARKER_HEIGHT = 144;
const PRINT_SIZE = 16;
// Huellitas que va dejando por el sendero mientras camina: muestran por dónde pasó.
const PRINT_COUNT = 6;

type PawPrintProps = {
  index: number;
  walk: SharedValue<number>;
  from: TrailPoint;
  to: TrailPoint;
  startT: number;
  endT: number;
  scale: number;
  zoom: number;
};

function PawPrint({ index, walk, from, to, startT, endT, scale, zoom }: PawPrintProps) {
  // El avance (0 a 1) en el que Pandoro pisa esta huella.
  const stepAt = (index + 1) / (PRINT_COUNT + 1);
  const side = index % 2 === 0 ? -1 : 1;

  const style = useAnimatedStyle(() => {
    const point = trailPoint(from, to, startT + (endT - startT) * stepAt);
    const progress = walk.value;
    const appear = Math.min(1, Math.max(0, (progress - stepAt) * 9));
    const fadeOut = 1 - Math.min(1, Math.max(0, (progress - 0.9) * 10));
    return {
      opacity: appear * fadeOut * 0.6,
      transform: [
        { translateX: point.x * scale + 40 * zoom * scale - PRINT_SIZE / 2 + side * 7 },
        { translateY: point.y - 18 * zoom - PRINT_SIZE - 2 },
        { rotate: `${side * 12}deg` },
        { scale: 0.7 + appear * 0.3 },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.print, style]}>
      <Svg width={PRINT_SIZE} height={PRINT_SIZE} viewBox="0 0 16 16">
        <Ellipse cx="8" cy="10.5" rx="4" ry="3.4" fill={palette.pandaDark} />
        <Circle cx="3.2" cy="6" r="1.7" fill={palette.pandaDark} />
        <Circle cx="6.4" cy="3.4" r="1.7" fill={palette.pandaDark} />
        <Circle cx="9.8" cy="3.4" r="1.7" fill={palette.pandaDark} />
        <Circle cx="12.9" cy="6" r="1.7" fill={palette.pandaDark} />
      </Svg>
    </Animated.View>
  );
}

export function PandoroProgressMarker({
  worldWidth,
  from,
  to,
  startT = 0,
  endT = 0,
  duration = 2600,
  hops = 6,
  animationKey = 0,
}: PandoroProgressMarkerProps) {
  const scale = worldWidth / PROGRESS_WORLD_WIDTH;
  const zoom = getLandmarkZoom(worldWidth);
  const target = to ?? from;
  const moving = to !== undefined && startT !== endT;
  const walk = useSharedValue(moving ? 0 : 1);
  const fromX = from.x;
  const fromY = from.y;
  const toX = target.x;
  const toY = target.y;

  useEffect(() => {
    if (!moving) {
      walk.value = 1;
      return;
    }
    walk.value = 0;
    // Velocidad casi pareja de principio a fin: se ve caminar, no deslizarse.
    walk.value = withTiming(1, { duration, easing: Easing.inOut(Easing.sin) });
  }, [walk, moving, duration, animationKey, startT, endT]);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = walk.value;
    const t = startT + (endT - startT) * progress;
    // Misma curva que el sendero de ProgressPath: sube, cruza y vuelve a subir.
    const point = trailPoint({ x: fromX, y: fromY }, { x: toX, y: toY }, t);
    const left = Math.min(
      worldWidth - MARKER_WIDTH,
      Math.max(0, point.x * scale - MARKER_WIDTH / 2 + 40 * zoom * scale),
    );
    const walking = progress > 0 && progress < 1;
    // Cada paso: salta, cae aplastándose un poco y se balancea hacia el lado del pie que pisa.
    const phase = progress * Math.PI * hops;
    const bounce = walking ? Math.abs(Math.sin(phase)) : 0;
    const lift = bounce * 15;
    const sway = walking ? Math.sin(phase) * 8 : 0;
    const squash = walking ? 1 - 0.06 * (1 - bounce) + 0.03 * bounce : 1;
    const widen = walking ? 1 + 0.05 * (1 - bounce) - 0.02 * bounce : 1;

    return {
      transform: [
        { translateX: left },
        { translateY: point.y - MARKER_HEIGHT - 18 * zoom - lift },
        { rotate: `${sway}deg` },
        { scaleX: widen },
        { scaleY: squash },
      ],
    };
  });

  return (
    <>
      {moving
        ? Array.from({ length: PRINT_COUNT }, (_, index) => (
          <PawPrint
            key={index}
            index={index}
            walk={walk}
            from={from}
            to={target}
            startT={startT}
            endT={endT}
            scale={scale}
            zoom={zoom}
          />
        ))
        : null}
      <Animated.View
        pointerEvents="none"
        accessibilityLabel={moving ? 'Pandoro avanza por el camino' : 'Pandoro está en su camino'}
        style={[styles.container, animatedStyle]}
      >
        <Pandoro size={108} />
      </Animated.View>
    </>
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
    // El balanceo y el aplastón giran desde los pies, no desde el centro.
    transformOrigin: '50% 100%',
  },
  print: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PRINT_SIZE,
    height: PRINT_SIZE,
    zIndex: 6,
  },
});
