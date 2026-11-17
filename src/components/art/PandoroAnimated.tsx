import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import {
  ARMS,
  ARM_RIMS,
  EARS,
  EAR_RIMS,
  LEGS,
  LEG_RIMS,
  Lights,
  PandoroBodyGroup,
  PandoroDefs,
  PandoroHeadGroup,
  PandoroPawPad,
  ovalTransform,
  usePandoroIds,
  type PandoroIds,
} from '@/components/art/Pandoro';
import { addPoses, celebratePose, walkPose, type PandoroPose } from '@/services/progress/pandaPose';

// Pandoro armado en capas: cada parte (cuerpo, cabeza, orejas, brazos, patas) es su propio dibujo
// SVG con el mismo lienzo de 280 × 280 que Pandoro, y se mueve girando sobre su articulación.
// En reposo (progress = 1, celebrate = 0) se ve igual que <Pandoro />.
type PandoroAnimatedProps = {
  size?: number;
  // 0 a 1 mientras camina; fuera de ese rango (o 1) está quieto.
  progress?: SharedValue<number>;
  // 0 a 1 mientras celebra la llegada; 0 es reposo.
  celebrate?: SharedValue<number>;
  // Pasos del recorrido (los mismos que usa el marcador para saltar).
  hops?: number;
};

type Pose = DerivedValue<PandoroPose>;

const CANVAS = 280;
// Articulaciones, en porcentaje del lienzo: el giro parte de ahí.
const PIVOT = {
  rig: '50% 93.6%',
  neck: '50% 62.5%',
  earLeft: '26.8% 28.6%',
  earRight: '73.2% 28.6%',
  armLeft: '39.3% 60%',
  armRight: '60.7% 60%',
  legLeft: '33.9% 76.8%',
  legRight: '66.1% 76.8%',
} as const;

// Cada capa es un SVG completo con sus propios degradados: así los ids no se repiten en la web.
function SvgLayer({ size, children }: { size: number; children: (ids: PandoroIds) => ReactNode }) {
  const ids = usePandoroIds();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
      <PandoroDefs ids={ids} />
      {children(ids)}
    </Svg>
  );
}

type PartProps = { size: number; pose: Pose };

function EarLayer({ size, pose, index }: PartProps & { index: 0 | 1 }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${index === 0 ? pose.value.earLeft : pose.value.earRight}deg` }],
  }));
  return (
    <Animated.View
      style={[styles.layer, { transformOrigin: index === 0 ? PIVOT.earLeft : PIVOT.earRight }, style]}
    >
      <SvgLayer size={size}>
        {(ids) => (
          <>
            <Circle {...EARS[index]} fill={`url(#${ids.darkFur})`} />
            <G clipPath={`url(#${ids.earsClip})`}>
              <Lights lights={[EAR_RIMS[index]]} ids={ids} />
            </G>
          </>
        )}
      </SvgLayer>
    </Animated.View>
  );
}

function ArmLayer({ size, pose, index }: PartProps & { index: 0 | 1 }) {
  const style = useAnimatedStyle(() => ({
    // El brazo derecho se abre girando al revés que el izquierdo.
    transform: [{ rotate: `${index === 0 ? pose.value.armLeft : -pose.value.armRight}deg` }],
  }));
  return (
    <Animated.View
      style={[styles.layer, { transformOrigin: index === 0 ? PIVOT.armLeft : PIVOT.armRight }, style]}
    >
      <SvgLayer size={size}>
        {(ids) => (
          <>
            <Ellipse {...ARMS[index]} transform={ovalTransform(ARMS[index])} fill={`url(#${ids.darkFur})`} />
            <G clipPath={`url(#${ids.armsClip})`}>
              <Lights lights={[ARM_RIMS[index]]} ids={ids} />
            </G>
          </>
        )}
      </SvgLayer>
    </Animated.View>
  );
}

function LegLayer({ size, pose, index }: PartProps & { index: 0 | 1 }) {
  const scale = size / CANVAS;
  const style = useAnimatedStyle(() => {
    const swing = index === 0 ? pose.value.legLeft : pose.value.legRight;
    const lift = index === 0 ? pose.value.legLiftLeft : pose.value.legLiftRight;
    return { transform: [{ translateY: -lift * scale }, { rotate: `${swing}deg` }] };
  });
  return (
    <Animated.View
      style={[styles.layer, { transformOrigin: index === 0 ? PIVOT.legLeft : PIVOT.legRight }, style]}
    >
      <SvgLayer size={size}>
        {(ids) => (
          <>
            <Ellipse {...LEGS[index]} transform={ovalTransform(LEGS[index])} fill={`url(#${ids.darkFur})`} />
            <G clipPath={`url(#${ids.legsClip})`}>
              <Lights lights={[LEG_RIMS[index]]} ids={ids} />
            </G>
            <PandoroPawPad ids={ids} side={index} />
          </>
        )}
      </SvgLayer>
    </Animated.View>
  );
}

export function PandoroAnimated({ size = 250, progress, celebrate, hops = 6 }: PandoroAnimatedProps) {
  const scale = size / CANVAS;
  const restProgress = useSharedValue(1);
  const restCelebrate = useSharedValue(0);
  const walkValue = progress ?? restProgress;
  const celebrateValue = celebrate ?? restCelebrate;

  // Una sola evaluación por cuadro; todas las partes leen la misma pose.
  const pose = useDerivedValue(() => addPoses(walkPose(walkValue.value, hops), celebratePose(celebrateValue.value)));

  const shadowStyle = useAnimatedStyle(() => {
    const lift = pose.value.lift;
    // Al saltar, la sombra se encoge y se aclara.
    return { opacity: Math.max(0.4, 1 + lift * 0.012), transform: [{ scaleX: Math.max(0.6, 1 + lift * 0.006) }] };
  });
  const rigStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pose.value.shift * scale },
      { translateY: pose.value.lift * scale },
      { rotate: `${pose.value.lean}deg` },
      { scaleX: 1 - pose.value.squash * 0.6 },
      { scaleY: 1 + pose.value.squash },
    ],
  }));
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pose.value.headLift * scale }, { rotate: `${pose.value.headTilt}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Animated.View style={[styles.layer, { transformOrigin: '50% 93.6%' }, shadowStyle]}>
        <SvgLayer size={size}>
          {() => <Ellipse cx="140" cy="261" rx="88" ry="11" fill="#6F945F" opacity=".23" />}
        </SvgLayer>
      </Animated.View>

      <Animated.View style={[styles.layer, { transformOrigin: PIVOT.rig }, rigStyle]}>
        <StillLayer size={size}>
          <SvgLayer size={size}>{(ids) => <PandoroBodyGroup ids={ids} />}</SvgLayer>
        </StillLayer>

        <Animated.View style={[styles.layer, { transformOrigin: PIVOT.neck }, headStyle]}>
          <EarLayer size={size} pose={pose} index={0} />
          <EarLayer size={size} pose={pose} index={1} />
          <StillLayer size={size}>
            <SvgLayer size={size}>{(ids) => <PandoroHeadGroup ids={ids} withEars={false} />}</SvgLayer>
          </StillLayer>
        </Animated.View>

        <ArmLayer size={size} pose={pose} index={0} />
        <ArmLayer size={size} pose={pose} index={1} />
        <LegLayer size={size} pose={pose} index={0} />
        <LegLayer size={size} pose={pose} index={1} />
      </Animated.View>
    </Animated.View>
  );
}

// Capa quieta: ocupa el lienzo entero sin moverse por su cuenta.
function StillLayer({ size, children }: { size: number; children: ReactNode }) {
  return <Animated.View style={[styles.layer, { width: size, height: size }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
