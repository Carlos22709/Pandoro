import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { PandoroProgressMarker } from '@/components/progress/PandoroProgressMarker';
import { ProgressLandmark } from '@/components/progress/ProgressLandmark';
import { ProgressPath } from '@/components/progress/ProgressPath';
import {
  PROGRESS_WORLD_HEIGHT,
  PROGRESS_WORLD_WIDTH,
  getLandmarkZoom,
  type ProgressWorldStage,
} from '@/components/progress/worldData';
import { palette } from '@/theme/palette';

type ProgressWorldProps = {
  currentStage: number;
  stages: ProgressWorldStage[];
  onLandmarkPress: (stage: ProgressWorldStage) => void;
  // Llegada a un lugar nuevo: Pandoro camina hasta él y después el lugar florece.
  walkTo?: ProgressWorldStage;
  walkDuration?: number;
  bloomingStageId?: number;
};

function ProgressWorldLandscape() {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={'0 0 ' + PROGRESS_WORLD_WIDTH + ' ' + PROGRESS_WORLD_HEIGHT}
      preserveAspectRatio="none"
      style={styles.landscape}
    >
      <Defs>
        <LinearGradient id="progress-sky" x1="0" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E9D2F5" />
          <Stop offset="0.42" stopColor="#FFDDC0" />
          <Stop offset="1" stopColor="#FFF1D2" />
        </LinearGradient>
        <RadialGradient id="progress-panden-glow" cx="198" cy="118" r="150" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFD87A" stopOpacity="0.95" />
          <Stop offset="0.55" stopColor="#FFE3A6" stopOpacity="0.45" />
          <Stop offset="1" stopColor="#FFE3A6" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={PROGRESS_WORLD_WIDTH} height={PROGRESS_WORLD_HEIGHT} fill="#B8D9A2" />
      {/* Cielo de hora dorada y resplandor detrás del Pandén. */}
      <Rect width={PROGRESS_WORLD_WIDTH} height="500" fill="url(#progress-sky)" />
      <Circle cx="198" cy="118" r="150" fill="url(#progress-panden-glow)" />

      <Path
        d="M0 245c47-77 95-81 143-15 57-105 113-103 168-17 31-35 57-45 79-30v340H0Z"
        fill="#A7D29A"
      />
      <Path
        d="M0 351c59-54 112-47 159 5 54-67 116-75 231-14v252H0Z"
        fill="#79B68A"
        opacity=".8"
      />
      <Path
        d="M0 470c55-35 103-25 148 8 48 35 96 35 144-2 34-26 67-30 98-12v386c-54-31-103-24-149 13-48 38-96 39-145 2-38-29-71-37-96-23Z"
        fill="#B4D89C"
      />
      <Path
        d="M0 825c48-27 91-21 132 14 45 39 91 39 138 2 42-33 82-38 120-17v406c-44-25-85-18-128 16-48 38-96 38-142 1-41-33-81-39-120-18Z"
        fill="#9FCB8F"
      />
      <Path
        d="M0 1198c45-29 87-19 127 15 43 37 88 39 133 3 45-36 87-41 130-15v471H0Z"
        fill="#AED493"
      />

      <Ellipse cx="292" cy="1105" rx="100" ry="74" fill="#86BD82" opacity=".4" />

      <G fill={palette.rock} opacity=".62">
        <Ellipse cx="189" cy="1277" rx="18" ry="10" />
        <Ellipse cx="332" cy="1452" rx="23" ry="12" />
      </G>

      <G opacity=".52">
        <G fill="#B89C84">
          <Rect x="17" y="1092" width="6" height="22" rx="2" />
          <Rect x="47.5" y="1106" width="5" height="16" rx="2" />
        </G>
        <Path
          d="M20 975L4 1025L20 1020ZM20 1005L-1 1060L20 1054ZM20 1040L-6 1100L20 1093ZM50 1045L37 1080L50 1076ZM50 1068L32 1110L50 1105Z"
          fill={palette.green}
        />
        <Path
          d="M20 975L36 1025L20 1020ZM20 1005L41 1060L20 1054ZM20 1040L46 1100L20 1093ZM50 1045L63 1080L50 1076ZM50 1068L68 1110L50 1105Z"
          fill={palette.greenDeep}
        />
      </G>

      <G fill={palette.greenDeep} opacity=".28">
        <Circle cx="20" cy="555" r="40" />
        <Circle cx="374" cy="720" r="46" />
        <Circle cx="18" cy="1180" r="42" />
        <Circle cx="373" cy="1470" r="50" />
      </G>
      <G fill={palette.green} opacity=".4">
        <Circle cx="3" cy="582" r="31" />
        <Circle cx="388" cy="746" r="34" />
        <Circle cx="2" cy="1210" r="31" />
        <Circle cx="388" cy="1505" r="36" />
      </G>

      <Path
        d="M0 1486c59-38 111-27 157 4 51 35 102 36 153 3 31-20 58-24 80-13v192H0Z"
        fill="#84B96F"
        opacity=".76"
      />
    </Svg>
  );
}

export function ProgressWorld({
  currentStage,
  stages,
  onLandmarkPress,
  walkTo,
  walkDuration,
  bloomingStageId,
}: ProgressWorldProps) {
  const { width } = useWindowDimensions();
  const worldWidth = Math.min(width, 480);
  const current = stages.find((stage) => stage.status === 'current');

  return (
    <View style={[styles.world, { width: worldWidth, height: PROGRESS_WORLD_HEIGHT }]}>
      <ProgressWorldLandscape />
      <ProgressPath currentStage={currentStage} stages={stages} zoom={getLandmarkZoom(worldWidth)} />
      {stages.map((stage) => (
        <ProgressLandmark
          key={stage.id}
          stage={stage}
          worldWidth={worldWidth}
          blooming={stage.id === bloomingStageId}
          onPress={() => onLandmarkPress(stage)}
        />
      ))}
      {current ? (
        <PandoroProgressMarker
          x={current.x}
          y={current.y}
          worldWidth={worldWidth}
          walkTo={walkTo}
          walkDuration={walkDuration}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  world: {
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  landscape: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
