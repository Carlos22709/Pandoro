import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { LandmarkBloom } from '@/components/progress/LandmarkBloom';
import { PANDEN_GEOMETRY } from '@/components/progress/pandenGeometry';
import {
  PROGRESS_WORLD_WIDTH,
  getLandmarkZoom,
  type ProgressWorldLandmark,
  type ProgressWorldStage,
  type ProgressWorldStatus,
} from '@/components/progress/worldData';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type ProgressLandmarkProps = {
  stage: ProgressWorldStage;
  worldWidth: number;
  blooming?: boolean;
  onPress: () => void;
};

type LandmarkSceneProps = {
  landmark: ProgressWorldLandmark;
  status: ProgressWorldStatus;
  isNext: boolean;
  zoom: number;
};

const NODE_WIDTH = 170;
const NODE_HEIGHT = 142;

type OrigamiTulipProps = {
  transform: string;
  petal: string;
  petalShade: string;
  stem: string;
  leftLeaf?: string;
  rightLeaf?: string;
};

function OrigamiTulip({ transform, petal, petalShade, stem, leftLeaf, rightLeaf }: OrigamiTulipProps) {
  return (
    <G transform={transform}>
      <Path d="M0 0V-22" stroke={stem} strokeWidth="2.2" strokeLinecap="round" />
      {leftLeaf ? <Path d="M0 -2L-11 -15L-2 -9Z" fill={leftLeaf} /> : null}
      {rightLeaf ? <Path d="M0 -4L10 -14L2 -9Z" fill={rightLeaf} /> : null}
      <Path d="M0 -21L-7 -28V-36L-2.5 -31.5L0 -36Z" fill={petal} />
      <Path d="M0 -21L7 -28V-36L2.5 -31.5L0 -36Z" fill={petalShade} />
    </G>
  );
}

// Bosque de origami: islita de papel, zorro plegado, dos pinos y tulipanes.
// La zona superior derecha queda libre para Pandoro.
function OrigamiForestScene({ vivid, locked }: { vivid: boolean; locked: boolean }) {
  const groundTop = vivid ? '#EAF2D8' : '#E6ECDB';
  const groundCrease = vivid ? '#DEEBC8' : '#DCE4CF';
  const groundSide = vivid ? '#BFDBA4' : '#C4D5B6';
  const groundSideShade = vivid ? '#AFCF95' : '#B6C9A8';
  const trailSide = vivid ? '#E9D8BC' : '#E2D6C4';
  const pine = vivid ? '#8CC496' : '#A2BFA2';
  const pineShade = vivid ? '#66A57B' : '#83A487';
  const trunk = vivid ? '#C9A283' : '#BDA895';
  const fox = vivid ? '#F4B27E' : '#E2BC9C';
  const foxMid = vivid ? '#EA9A63' : '#D6AA88';
  const foxShade = vivid ? '#D9844F' : '#C99A7B';
  const foxCream = vivid ? '#FFF3E2' : '#F8EFE3';
  const tulip = vivid ? '#F3A9B8' : '#DDB3BA';
  const tulipShade = vivid ? '#E28A9E' : '#CF9EA7';
  const stem = vivid ? '#6FAE81' : '#86A78C';
  const stemLeaf = vivid ? '#94CB9C' : '#AFC7AE';

  return (
    <G>
      <Ellipse cx="85" cy="101" rx="78" ry="17" fill="#6E9E63" opacity=".16" />
      <Path d="M10 100C14 112 50 124 85 124S156 112 160 100A75 15 0 0 1 10 100Z" fill={groundSide} />
      <Path d="M85 115V124C120 124 156 112 160 100A75 15 0 0 1 85 115Z" fill={groundSideShade} />
      <Ellipse cx="85" cy="100" rx="75" ry="15" fill={groundTop} />
      <Path d="M108 85.7L70 114.7A75 15 0 0 0 108 85.7Z" fill={groundCrease} />
      <Path d="M71 114.8C74 104 80 94 81 85.1H91C92 95 96 104 100 114.7Z" fill={palette.creamStrong} />
      <Path d="M71 114.8H100L101 123.7C95 124 75 124 70 123.6Z" fill={trailSide} />

      <Rect x="27.5" y="80" width="5" height="13" rx="1.5" fill={trunk} />
      <Path d="M30 52L11 84L30 80ZM30 38L15 66L30 62ZM30 25L19 49L30 46Z" fill={pine} />
      <Path d="M30 52L49 84L30 80ZM30 38L45 66L30 62ZM30 25L41 49L30 46Z" fill={pineShade} />
      <Ellipse cx="30" cy="93" rx="11" ry="2.5" fill={groundCrease} />

      <Rect x="102" y="76" width="4.5" height="11" rx="1.5" fill={trunk} />
      <Path d="M104 56L90 80L104 76ZM104 45L94 65L104 62Z" fill={pine} />
      <Path d="M104 56L118 80L104 76ZM104 45L114 65L104 62Z" fill={pineShade} />

      <Ellipse cx="56" cy="105" rx="23" ry="3.6" fill={groundCrease} />
      <G transform="translate(58 105)">
        <Path d="M-13 -12L-38 -27L-12 -7Z" fill={fox} />
        <Path d="M-12 -7L-38 -27L-30 -6L-12 -2Z" fill={foxMid} />
        <Path d="M-38 -27L-30.5 -22.5L-29.7 -20.6L-35.2 -19.7Z" fill={foxCream} />
        <Path d="M-5 -38L7 -36L13 0H-16L-17 -8Z" fill={fox} />
        <Path d="M-5 -38L-17 -8L-4 -14Z" fill={foxMid} />
        <Path d="M-17 -8L-4 -14L3 0H-16Z" fill={foxShade} />
        <Path d="M1 -35H8L12 -16L6 -9Z" fill={foxCream} />
        <Path d="M-6 -48V-64L2 -51Z" fill={foxMid} />
        <Path d="M-7 -42L-5 -49L4 -52L8 -35L-2 -36Z" fill={foxMid} />
        <Path d="M4 -52L21 -41L8 -35Z" fill={fox} />
        <Path d="M6.4 -43L21 -41L8 -35Z" fill={foxCream} />
        <Path d="M1 -51L6 -66L10 -49Z" fill={fox} />
        <Path d="M3.5 -51L6 -60L8 -50Z" fill={foxShade} />
        <Circle cx="21" cy="-41" r="1.8" fill={palette.pandaDark} />
        <Path d="M6.5 -46.5Q9 -48.5 11.5 -46.5" fill="none" stroke={palette.pandaDark} strokeWidth="1.4" strokeLinecap="round" />
      </G>

      <OrigamiTulip
        transform="translate(128 110) scale(0.82)"
        petal={tulip}
        petalShade={tulipShade}
        stem={stem}
        leftLeaf={stemLeaf}
        rightLeaf={stem}
      />
      <OrigamiTulip
        transform="translate(147 104) scale(0.66)"
        petal={tulip}
        petalShade={tulipShade}
        stem={stem}
        leftLeaf={stemLeaf}
      />
      {!locked && (
        <OrigamiTulip
          transform="translate(16 107) scale(0.6)"
          petal={tulip}
          petalShade={tulipShade}
          stem={stem}
          rightLeaf={stem}
        />
      )}

      <Path d="M110 106L116 103L120 106Z" fill={pine} />
      <Path d="M110 106H120L114 109Z" fill={pineShade} />
      {!locked && (
        <>
          <Path d="M141 64L146 60L151 63Z" fill={fox} />
          <Path d="M141 64L151 63L146 67Z" fill={foxMid} />
        </>
      )}
    </G>
  );
}

type VenusTrapProps = {
  transform: string;
  lobe: string;
  lobeShade: string;
  inside: string;
  cilia: string;
};

// Trampa de atrapamoscas abierta hacia +x, con la bisagra en (-8, 0).
function VenusTrap({ transform, lobe, lobeShade, inside, cilia }: VenusTrapProps) {
  return (
    <G transform={transform}>
      <G transform="translate(2 5.5) rotate(18)">
        <Path d="M9.9 1L12.9 1.9M8.2 3.4L10.3 5.9M5 5.2L6 8.2M0.9 6L1 9.2" stroke={cilia} strokeWidth="1.5" strokeLinecap="round" />
        <Ellipse rx="10" ry="6" fill={lobeShade} />
        <Ellipse cx="1" cy="-1.3" rx="8" ry="3.8" fill={inside} />
      </G>
      <G transform="translate(2 -6) rotate(-22)">
        <Path d="M9.9 -1.1L12.9 -2M8.2 -3.7L10.4 -6.1M5 -5.6L6.1 -8.6M0.9 -6.5L1 -9.7" stroke={cilia} strokeWidth="1.5" strokeLinecap="round" />
        <Ellipse rx="10" ry="6.5" fill={lobe} />
        <Ellipse cx="1" cy="1.4" rx="8" ry="4.2" fill={inside} />
      </G>
    </G>
  );
}

const PETAL_ANGLES = [0, 1, 2, 3, 4, 5, 6].map((index) => (index * 360) / 7);

// La casa de la Sra. Venus: flor amiga a la izquierda y la maceta-casita de la
// atrapamoscas a la derecha. La zona superior derecha queda libre para Pandoro.
function VenusHouseScene({ vivid, locked }: { vivid: boolean; locked: boolean }) {
  const groundTop = vivid ? '#C6E3A6' : '#C8DFAD';
  const groundLight = vivid ? '#D3EAB5' : '#D3E6BC';
  const groundSide = vivid ? '#94C379' : '#98BF80';
  const trailSide = vivid ? '#E8D5B5' : '#E5D5BA';
  const stem = vivid ? '#5FA872' : '#66A677';
  const leaf = vivid ? '#8ACB86' : '#8FC68B';
  const leafShade = vivid ? '#62A96F' : '#68A774';
  const petal = vivid ? '#F4A6B6' : '#F0A9B7';
  const petalBack = vivid ? '#EA869C' : '#E48DA0';
  const disk = vivid ? '#FAD677' : '#F4D47F';
  const diskRing = vivid ? '#EDBB57' : '#E6BA62';
  const face = '#6E4658';
  const blush = vivid ? '#EE8A9E' : '#E88FA1';
  const pot = vivid ? '#E8976F' : '#E29B77';
  const potShade = vivid ? '#D6805A' : '#D08663';
  const potRim = vivid ? '#F1B28E' : '#EDB594';
  const soil = vivid ? '#946650' : '#936A56';
  const door = vivid ? '#BE6F50' : '#B97458';
  const knob = vivid ? '#F7D270' : '#F0CF7A';
  const trap = vivid ? '#7CC27A' : '#80BE7F';
  const trapShade = vivid ? '#5DA766' : '#62A46B';
  const trapInside = vivid ? '#F08A9E' : '#EA8EA1';
  const cilia = vivid ? '#B5E09A' : '#B8DCA1';
  const bow = vivid ? '#BFA3EC' : '#BFA8E6';
  const bowKnot = vivid ? '#A284DA' : '#A58BD6';
  const trapColors = { lobe: trap, lobeShade: trapShade, inside: trapInside, cilia };

  return (
    <G>
      <Ellipse cx="85" cy="104" rx="78" ry="18" fill="#5E9463" opacity=".14" />
      <Path d="M11 101C14 113 48 124 85 124S156 113 159 101A74 16 0 0 1 11 101Z" fill={groundSide} />
      <Ellipse cx="85" cy="101" rx="74" ry="16" fill={groundTop} />
      <Ellipse cx="78" cy="98" rx="56" ry="10" fill={groundLight} />
      <Path d="M108.8 116.1L125.5 114.5L128 119C121 121 114 122.3 107 122.7Z" fill={trailSide} />
      <Path d="M111 112H123L125.5 114.5L108.8 116.1Z" fill={palette.creamStrong} />

      <Path d="M46 106C45 90 41 70 41 48" fill="none" stroke={stem} strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M45 90C52 79 63 76 72 79C65 88 55 93 45 90Z" fill={leaf} />
      <Path d="M45 90C55 86 64 82 72 79C65 88 55 93 45 90Z" fill={leafShade} />
      <Path d="M44 98C37 90 27 89 20 92C26 99 35 101 44 98Z" fill={leaf} />
      <Path d="M44 98C35 95 27 93 20 92C26 99 35 101 44 98Z" fill={leafShade} />

      <G transform="translate(41 38) rotate(8)">
        {PETAL_ANGLES.map((angle) => (
          <Ellipse
            key={'back-' + angle}
            cy="-11.5"
            rx="7"
            ry="10"
            fill={petalBack}
            transform={'rotate(' + (angle + 360 / 14) + ')'}
          />
        ))}
        {PETAL_ANGLES.map((angle) => (
          <Ellipse
            key={'front-' + angle}
            cy="-12.5"
            rx="8"
            ry="11"
            fill={petal}
            transform={'rotate(' + angle + ')'}
          />
        ))}
        <Circle r="12.4" fill={diskRing} />
        <Circle r="11.2" fill={disk} />
        <Ellipse cx="-6" cy="3" rx="2.4" ry="1.5" fill={blush} opacity=".8" />
        <Ellipse cx="7" cy="3" rx="2.4" ry="1.5" fill={blush} opacity=".8" />
        <Circle cx="-3.4" cy="-1.6" r="1.35" fill={face} />
        <Path d="M2.8 -1.2Q4.6 -3.2 6.4 -1.2M-1.6 3.6Q1 6 3.6 3.6" fill="none" stroke={face} strokeWidth="1.2" strokeLinecap="round" />
      </G>

      <G fill="none" stroke={stem} strokeLinecap="round">
        <Path d="M116 84C114 76 113 70 115.6 63.6" strokeWidth="2.6" />
        <Path d="M121 84C126 77 130 72 133.8 68.6M111 84C108 79 105 74 103.6 69.5" strokeWidth="2.2" />
      </G>
      <VenusTrap transform="translate(122 56) rotate(-50) scale(1.1)" {...trapColors} />
      <VenusTrap transform="translate(141 66) rotate(-20) scale(0.85)" {...trapColors} />
      <VenusTrap transform="translate(99 64) rotate(-130) scale(0.8)" {...trapColors} />
      <G transform="translate(114.6 72) rotate(-8)">
        <Ellipse cx="-3.2" rx="3.2" ry="2.1" fill={bow} transform="rotate(-18 -3.2 0)" />
        <Ellipse cx="3.2" rx="3.2" ry="2.1" fill={bow} transform="rotate(18 3.2 0)" />
        <Circle r="1.3" fill={bowKnot} />
      </G>

      <Path d="M98 89H136L132 112H102Z" fill={pot} />
      <Path d="M124 89H136L132 112H122Z" fill={potShade} />
      <Rect x="95" y="82" width="44" height="8" rx="3" fill={potRim} />
      <Ellipse cx="117" cy="82.6" rx="19" ry="2.2" fill={soil} />
      <Path d="M112 112V104A5 5 0 0 1 122 104V112Z" fill={door} />
      <Circle cx="120" cy="108" r="0.9" fill={knob} />

      <Path
        d="M150 101C149 96 147 93 145 91M152 101C153 95 155 92 158 90M154 101C154 97 156 95 157 94M16 104C15 99 13 97 11 96M18 104C19 99 21 97 23 96"
        fill="none"
        stroke={leafShade}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {!locked && (
        <>
          <Circle cx="102" cy="46" r="4.5" fill="#FFF3C4" opacity=".45" />
          <Circle cx="102" cy="46" r="1.7" fill="#FFE9A0" />
          <Path d="M68 22L69 25L72 26L69 27L68 30L67 27L64 26L67 25Z" fill="#FFF3C4" />
        </>
      )}
    </G>
  );
}

type RoseProps = {
  x: number;
  y: number;
  r: number;
  fill: string;
  light: string;
  deep: string;
};

function Rose({ x, y, r, fill, light, deep }: RoseProps) {
  return (
    <G transform={'translate(' + x + ' ' + y + ') scale(' + r / 6 + ')'}>
      <Circle r="6" fill={fill} />
      <Circle cx="-1.1" cy="-1.2" r="3.7" fill={light} />
      <Path d="M-2.1 -0.9Q0 -3.3 1.8 -0.6Q1.2 1.8 -0.6 0.9" fill="none" stroke={deep} strokeWidth="1.1" strokeLinecap="round" />
    </G>
  );
}

type RoseLeafProps = {
  x: number;
  y: number;
  angle: number;
  light: string;
  shade: string;
};

function RoseLeaf({ x, y, angle, light, shade }: RoseLeafProps) {
  return (
    <G transform={'translate(' + x + ' ' + y + ') rotate(' + angle + ')'}>
      <Path d="M0 0C2 -2.6 5.6 -3.2 8.4 -1.6C6 1 2.6 1.4 0 0Z" fill={light} />
      <Path d="M0 0C3 -0.6 6 -1.2 8.4 -1.6C6 1 2.6 1.4 0 0Z" fill={shade} />
    </G>
  );
}

const ROSE_LEAVES = [
  { x: 119.5, y: 88, angle: -40 },
  { x: 130, y: 86, angle: 20 },
  { x: 137.5, y: 90, angle: 35 },
  { x: 124, y: 97, angle: -25 },
  { x: 132.5, y: 99, angle: 40 },
];

// El rosal del fantasma enamorado: un fantasma tímido flota sobre el sendero
// y tiende el bracito hacia su rosal. La zona superior derecha queda libre para Pandoro.
function GhostRoseScene({ vivid, locked }: { vivid: boolean; locked: boolean }) {
  const groundTop = vivid ? '#DCCFEB' : '#DAD0E6';
  const groundLight = vivid ? '#E6DCF2' : '#E3DCEC';
  const groundSide = vivid ? '#BFAED8' : '#C0B3D3';
  const trailSide = vivid ? '#E8D5C0' : '#E4D6C6';
  const ghost = vivid ? '#FFF9F3' : '#FBF6F1';
  const ghostShade = vivid ? '#E9E0F0' : '#E6DFEC';
  const groundShadow = vivid ? '#B7A5D1' : '#B9ABCD';
  const eye = '#5E4760';
  const blush = vivid ? '#F4A3B5' : '#EBA9B6';
  const stem = vivid ? '#6FA079' : '#76A07D';
  const leafLight = vivid ? '#8DBB8C' : '#91B78F';
  const rose = vivid ? '#EA8C9F' : '#E4919F';
  const roseLight = vivid ? '#F4AFBC' : '#EEB0BB';
  const roseDeep = vivid ? '#D26F86' : '#CB7588';
  const heart = vivid ? '#F29BB0' : '#E9A1B2';
  const roseColors = { fill: rose, light: roseLight, deep: roseDeep };

  return (
    <G>
      <Ellipse cx="85" cy="104" rx="78" ry="18" fill="#5E7F63" opacity=".14" />
      <Path d="M11 101C14 113 48 124 85 124S156 113 159 101A74 16 0 0 1 11 101Z" fill={groundSide} />
      <Ellipse cx="85" cy="101" rx="74" ry="16" fill={groundTop} />
      <Ellipse cx="80" cy="98" rx="56" ry="10" fill={groundLight} />
      <Path d="M41 113.9L62 116.2L63.3 122.7C55 122.4 47 120.8 39.4 118.2Z" fill={trailSide} />
      <Path d="M41 113.9C44 110 47 107 50 104H57C58.5 107.5 60.5 111 62 116.2Z" fill={palette.creamStrong} />

      <Ellipse cx="52" cy="104" rx="19" ry="3.6" fill={groundShadow} opacity=".55" />
      <G transform="translate(52 96) rotate(7)">
        <Path
          d="M-19 -4C-21 -22 -20 -44 -12 -54C-6 -61 6 -61 12 -54C20 -44 21 -22 19 -4C16 -1 13 2 10 -1C7 -4 4 -1 2 1C-1 3 -4 0 -6 -2C-9 -4 -12 0 -14 1C-16 2 -18 -1 -19 -4Z"
          fill={ghostShade}
        />
        <Path
          d="M-19 -4C-21 -22 -20 -44 -12 -54C-6 -61 6 -61 12 -54C16 -49 16 -40 13 -30C10 -18 6 -8 2 1C-1 3 -4 0 -6 -2C-9 -4 -12 0 -14 1C-16 2 -18 -1 -19 -4Z"
          fill={ghost}
        />
        <Path d="M17 -30C23 -31 31 -30 36 -26C34 -23 26 -22 18 -24Z" fill={ghostShade} />
        <Path d="M-16 -27C-21 -30 -23 -35 -21 -40C-18 -39 -15 -35 -14 -31Z" fill={ghost} />
        <Ellipse cx="-3" cy="-40" rx="1.9" ry="2.7" fill={eye} />
        <Ellipse cx="7" cy="-40" rx="1.9" ry="2.7" fill={eye} />
        <Circle cx="-2.4" cy="-41.2" r="0.65" fill={palette.white} />
        <Circle cx="7.6" cy="-41.2" r="0.65" fill={palette.white} />
        <Ellipse cx="-7" cy="-34.5" rx="3" ry="1.8" fill={blush} opacity=".85" />
        <Ellipse cx="11" cy="-34.5" rx="3" ry="1.8" fill={blush} opacity=".85" />
        <Path d="M1.2 -34.6Q2.6 -33.2 4 -34.6" fill="none" stroke={eye} strokeWidth="1.1" strokeLinecap="round" />
      </G>

      <Ellipse cx="118" cy="103" rx="19" ry="4.4" fill={groundShadow} opacity=".45" />
      <G transform="translate(118 103) scale(1.15) translate(-128 -103)">
        <Path
          d="M127 103C126 94 121 86 115 79M128 103C129 90 130 80 130 68M129 103C132 95 138 89 143 84M128 103C130 98 134 95 138 93"
          fill="none"
          stroke={stem}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {ROSE_LEAVES.map((leafSpot) => (
          <RoseLeaf
            key={leafSpot.x + '-' + leafSpot.y}
            {...leafSpot}
            light={leafLight}
            shade={stem}
          />
        ))}
        <Rose x={114.5} y={76} r={6} {...roseColors} />
        <Rose x={130} y={64} r={6.6} {...roseColors} />
        <Rose x={144} y={81} r={5.4} {...roseColors} />
        <Path d="M136.5 93C136.5 90 138 88.6 139.4 88.6C140.8 88.6 142 90 141.4 93Z" fill={rose} />
      </G>

      <Path d="M91 108C92.5 106.5 95 106.8 95.8 108.6C94 110 92 109.8 91 108Z" fill={rose} opacity=".85" />
      <Path d="M30 109C31.5 107.8 33.8 108.2 34.4 109.8C32.8 110.9 31 110.6 30 109Z" fill={roseLight} />

      {!locked && (
        <>
          <Path d="M85 52C86.8 50.6 89.4 51.2 90 53.2C88.2 54.4 86 54 85 52Z" fill={roseLight} />
          <Path d="M66 26C66 23.6 69 22.8 70 25C71 22.8 74 23.6 74 26C74 28.6 70 31 70 31S66 28.6 66 26Z" fill={heart} />
        </>
      )}
    </G>
  );
}

const STAR_PATH = 'M-2.94 -4.05Q0 -12.5 2.94 -4.05Q11.89 -3.86 4.76 1.55Q7.35 10.11 0 5Q-7.35 10.11 -4.76 1.55Q-11.89 -3.86 -2.94 -4.05Z';

type StarFlowerProps = {
  x: number;
  y: number;
  scale: number;
  angle: number;
  sleeping?: boolean;
  fill: string;
  light: string;
  core: string;
  face: string;
  blush: string;
};

// Flor-estrella con los ojitos cerrados: no ve, escucha.
function StarFlower({ x, y, scale, angle, sleeping, fill, light, core, face, blush }: StarFlowerProps) {
  return (
    <G transform={'translate(' + x + ' ' + y + ') rotate(' + angle + ') scale(' + scale + ')'}>
      <Path d={STAR_PATH} fill={fill} />
      <Path d={STAR_PATH} fill={light} transform="translate(-0.7 -0.9) scale(0.74)" />
      <Circle r="3.1" fill={core} />
      {sleeping ? (
        <>
          <Path d="M-2.3 -0.2Q-1.5 0.7 -0.7 -0.2M0.7 -0.2Q1.5 0.7 2.3 -0.2" fill="none" stroke={face} strokeWidth="0.7" strokeLinecap="round" />
          <Circle cx="-2.2" cy="1.3" r="0.75" fill={blush} />
          <Circle cx="2.2" cy="1.3" r="0.75" fill={blush} />
        </>
      ) : null}
    </G>
  );
}

function Sparkle({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  return (
    <Path
      d="M0 -4Q0.6 -0.6 4 0Q0.6 0.6 0 4Q-0.6 0.6 -4 0Q-0.6 -0.6 0 -4Z"
      fill={fill}
      transform={'translate(' + x + ' ' + y + ') scale(' + size + ')'}
    />
  );
}

const STAR_FLOWERS = [
  { x: 40, y: 86, scale: 0.9, angle: -22, sleeping: false },
  { x: 63, y: 70, scale: 1.4, angle: -8, sleeping: true },
  { x: 94, y: 85, scale: 1.2, angle: 165, sleeping: true },
  { x: 117, y: 79, scale: 1.15, angle: 18, sleeping: true },
  { x: 146, y: 86, scale: 0.9, angle: 26, sleeping: false },
];

// El valle de las estrellas ciegas: flores-estrella de ojos cerrados que escuchan
// la trompeta de un pequeño ángel. La zona superior derecha queda libre para Pandoro.
function StarValleyScene({ vivid, locked }: { vivid: boolean; locked: boolean }) {
  const groundTop = vivid ? '#CBD6EF' : '#CDD5E8';
  const groundLight = vivid ? '#D8E1F4' : '#D8DEEC';
  const groundSide = vivid ? '#A9B7DE' : '#AEB8D6';
  const groundShadow = vivid ? '#98A7D2' : '#9EA9CB';
  const trailSide = vivid ? '#E6D6C4' : '#E3D7C8';
  const stem = vivid ? '#7AAA86' : '#80A78A';
  const leaf = vivid ? '#9CC99D' : '#A0C4A0';
  const face = '#8A6A55';
  const blush = vivid ? '#F3AFA8' : '#E9B3AD';
  const skin = vivid ? '#FFF4E6' : '#FBF2E7';
  const hair = vivid ? '#F2D89A' : '#EAD6A6';
  const robe = vivid ? '#F7F2FC' : '#F3EFF8';
  const robeShade = vivid ? '#DED3F0' : '#DCD4EA';
  const wing = vivid ? '#FFFFFF' : '#FCFBFE';
  const wingShade = vivid ? '#E4DAF3' : '#E1DAEE';
  const wingFeather = vivid ? '#EEE7F8' : '#ECE7F3';
  const brassDeep = vivid ? '#D29F45' : '#CFA45C';
  const brass = vivid ? '#EBC46F' : '#E2C27F';
  const brassLight = vivid ? '#F6DC98' : '#EFD9A5';
  const sparkle = vivid ? '#F6D36B' : '#EDCF82';
  const starColors = {
    fill: vivid ? '#F4C95F' : '#EBC872',
    light: vivid ? '#FADF8E' : '#F2DD9D',
    core: vivid ? '#FDEFC0' : '#F8ECC8',
    face,
    blush,
  };

  return (
    <G>
      <Ellipse cx="85" cy="104" rx="78" ry="18" fill="#5E7F63" opacity=".14" />
      <Path d="M11 101C14 113 48 124 85 124S156 113 159 101A74 16 0 0 1 11 101Z" fill={groundSide} />
      <Ellipse cx="85" cy="101" rx="74" ry="16" fill={groundTop} />
      <Ellipse cx="80" cy="98" rx="56" ry="10" fill={groundLight} />
      <Path d="M112 116.3L131 114.7L134 119.2C127 121 120 122.1 111 122.8Z" fill={trailSide} />
      <Path d="M112 116.3C114 111 117 106 119 102H125C127 106 129 110 131 114.7Z" fill={palette.creamStrong} />

      <Ellipse cx="44" cy="104" rx="16" ry="3" fill={groundShadow} opacity=".45" />

      <Path
        d="M45 106C44 100 42 94 40 89M62 106C63 95 63 84 63 74M80 105C80 94 81 82 86 75C90 70 95 72 95 77M108 106C109 97 112 89 115 84M143 104C143 99 144 94 146 89"
        fill="none"
        stroke={stem}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M62 96C57 93 53 93 50 95C53 98 58 98 62 96ZM80 98C85 95 89 95 92 97C89 100 84 100 80 98ZM109 99C104 96 100 96 98 98C101 101 105 101 109 99ZM143 99C139 97 136 97 134 99C137 101 140 101 143 99Z"
        fill={leaf}
      />
      {STAR_FLOWERS.map((flower) => (
        <StarFlower key={flower.x} {...flower} {...starColors} />
      ))}

      <G transform="translate(50 38) rotate(4) scale(1.5)">
        <Path d="M-2 -5C-9 -12 -20 -16 -30 -14C-27 -12 -26 -10 -25 -8C-28 -7 -28 -5 -26 -3C-19 -2 -10 -2 -2 -5Z" fill={wingShade} />
        <Path d="M-1 -4C-8 -1 -16 6 -25 17C-18 18 -10 16 -4 12C1 9 5 4 6 -1Z" fill={robeShade} />
        <Path d="M-1 -4C-7 0 -13 7 -20 15C-13 15 -6 11 -2 7C2 4 4 1 5 -1Z" fill={robe} />
        <Path d="M0 -6C-6 -14 -17 -19 -28 -17C-25 -15 -24 -12 -22 -10C-25 -9 -25 -6 -23 -4C-16 -3 -7 -3 0 -6Z" fill={wing} />
        <Path d="M-22 -10C-25 -9 -25 -6 -23 -4C-16 -3 -7 -3 0 -6C-7 -8 -15 -10 -22 -10Z" fill={wingFeather} />
        <Path d="M-3.5 2.5C-0.5 3.6 2.6 2.6 4.6 0.6" fill="none" stroke={brassLight} strokeWidth="1.2" strokeLinecap="round" />
        <Circle cx="4" cy="-9" r="5.2" fill={skin} />
        <Circle cx="-1.2" cy="-11.2" r="2.3" fill={hair} />
        <Path d="M-1.4 -8.8C-1.8 -13.4 2 -15.2 5.2 -14.4C8.4 -13.6 9.2 -11.4 8.6 -10.2C6 -11.8 2 -11.4 -1.4 -8.8Z" fill={hair} />
        <Path d={STAR_PATH} fill={starColors.fill} transform="translate(1.6 -14.4) scale(0.24)" />
        <Path d="M5.2 -9.2Q6.2 -8.3 7.2 -9.2" fill="none" stroke={face} strokeWidth="0.7" strokeLinecap="round" />
        <Circle cx="7.4" cy="-7.1" r="1" fill={blush} />

        <Path d="M11.4 -5.5C10.8 -2.8 14.6 -1.2 15.8 -3.5" fill="none" stroke={brass} strokeWidth="1.1" strokeLinecap="round" />
        <Path d="M8.6 -7L17.7 -2.8" stroke={brass} strokeWidth="1.6" strokeLinecap="round" />
        <G fill={brassLight}>
          <Circle cx="12.3" cy="-6.6" r="0.8" />
          <Circle cx="13.65" cy="-6" r="0.8" />
          <Circle cx="15" cy="-5.4" r="0.8" />
        </G>
        <Path d="M17.97 -3.9C22.08 -2.08 24.27 -2.5 26.08 -4.74Q27.8 0.4 21.6 4.86C22.15 2.03 21.07 0.09 17.03 -1.9Z" fill={brassLight} />
        <Ellipse cx="24.2" cy="0.2" rx="1.6" ry="5.2" fill={brassDeep} transform="rotate(25 24.2 0.2)" />
        <Path d="M1 -2.5C4.5 -1.5 7.5 -3.5 10 -5.8" fill="none" stroke={robe} strokeWidth="2.6" strokeLinecap="round" />
        <Circle cx="10.3" cy="-6.1" r="1.25" fill={skin} />
      </G>

      {!locked && (
        <>
          <Sparkle x={92} y={54} size={0.8} fill={sparkle} />
          <Sparkle x={100} y={62} size={0.6} fill={sparkle} />
          <Sparkle x={86} y={62} size={0.5} fill={sparkle} />
        </>
      )}
    </G>
  );
}

const SPIRAL_PATH = 'M0 0C0.9 -0.4 1 -1.4 0.2 -1.8C-0.9 -2.3 -2 -1.2 -1.9 0.1C-1.8 1.7 -0.1 2.6 1.4 2.1C3 1.5 3.5 -0.4 2.9 -1.9';
const BLOOM_BLADE = 'M0 -6.6C2.8 -8.4 4 -11.6 2.4 -13.8C2.6 -11.4 1 -9.2 -1.2 -8.2Z';
const WHIRL_BLADE = 'M0 -1.2C2.6 -4 3.2 -8.6 0.8 -11.2C2.2 -7.4 0.4 -4.2 -1.6 -2.2Z';
const BLOOM_BLADE_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
const WHIRL_BLADE_ANGLES = [0, 60, 120, 180, 240, 300];

const FIVE_PETALS = [0, 72, 144, 216, 288];

function Blossom({ x, y, petal, core }: { x: number; y: number; petal: string; core: string }) {
  return (
    <G transform={'translate(' + x + ' ' + y + ')'}>
      {FIVE_PETALS.map((angle) => (
        <Circle key={angle} cy="-1.7" r="1.35" fill={petal} transform={'rotate(' + angle + ')'} />
      ))}
      <Circle r="0.9" fill={core} />
    </G>
  );
}

const CANOPY_BLOSSOMS = [
  { x: 36, y: 11 },
  { x: 70, y: 15 },
  { x: 16, y: 33 },
  { x: 30, y: 39 },
  { x: 95, y: 37 },
];

// El Pandén: un Edén extraño bajo una luz dorada. Árbol antiguo con follaje en pisos
// y contraluz dorado, la serpiente rosada enroscada en la rama que contempla el fruto
// y flores imposibles. La zona superior derecha queda libre para Pandoro; el sendero
// termina al pie del árbol.
function PandenScene({ vivid, locked }: { vivid: boolean; locked: boolean }) {
  const earth = vivid ? '#F6D2A2' : '#EFD0A8';
  const moss = vivid ? '#4FA572' : '#58A276';
  const mossLight = vivid ? '#8FD39A' : '#92CC9B';
  const bark = vivid ? '#96583F' : '#945E48';
  const barkMid = vivid ? '#C07D57' : '#B98063';
  const barkLight = vivid ? '#E8AE83' : '#E0AE8B';
  const leafDeep = vivid ? '#2E8A6C' : '#378769';
  const leaf = vivid ? '#40AA80' : '#4AA682';
  const leafMid = vivid ? '#6FCB94' : '#76C697';
  const leafLight = vivid ? '#B2EDC0' : '#B4E6C0';
  const rim = vivid ? '#FFD56E' : '#F6D48A';
  const gold = vivid ? '#FFC94A' : '#F2C866';
  const goldLight = vivid ? '#FFE9A8' : '#F8E6B4';
  const snake = vivid ? '#EE8DB3' : '#E394B2';
  const snakeDeep = vivid ? '#C8618F' : '#BD6C91';
  const belly = vivid ? '#FFD9E6' : '#F8DAE4';
  const magenta = vivid ? '#E45AA6' : '#D766A6';
  const magentaLight = vivid ? '#FFA3D2' : '#F2A9CE';
  const bloomHeart = vivid ? '#A8438F' : '#A0508F';
  const coral = vivid ? '#FF8A68' : '#F29274';
  const berry = vivid ? '#C92E4A' : '#B94457';
  const blossom = vivid ? '#FF9FCB' : '#F4A6C9';
  const { pads, snakeHead } = PANDEN_GEOMETRY;

  return (
    <G>
      <Defs>
        <RadialGradient id="panden-fruit" cx="0.36" cy="0.34" r="0.78">
          <Stop offset="0" stopColor={vivid ? '#FFC2A6' : '#F8C3AC'} />
          <Stop offset="0.5" stopColor={vivid ? '#FF5F58' : '#EE6862'} />
          <Stop offset="1" stopColor={berry} />
        </RadialGradient>
      </Defs>

      <Ellipse cx="82" cy="112" rx="68" ry="7" fill="#6E8F4E" opacity=".16" />
      <Path d={PANDEN_GEOMETRY.mound} fill={moss} />
      <Path d={PANDEN_GEOMETRY.mound} fill={mossLight} transform="translate(80 104) scale(0.84 0.62) translate(-82 -106)" />
      <Path d="M73 114.4C76 110.5 79 107 81.5 104.6H89C91 107 94 110.5 97 114.6C89 115.4 81 115.3 73 114.4Z" fill={palette.creamStrong} opacity=".95" />
      <Path d="M50 104C56 101.5 66 101 76 101.5C86 101 94 102 98 104C92 106 80 106.5 70 106.5C60 106.5 53 106 50 104Z" fill={earth} />

      <Path d="M44 106C43 96 45 86 51 80C54 77 57 77.5 58 80" fill="none" stroke={moss} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="58.4" cy="88" r="5.5" fill={goldLight} opacity=".55" />
      <Path d="M58 80C54.5 80.5 53 84 53.4 88C54.8 87 56 87.4 56.6 89C57.6 87.6 59.2 87.6 60 89C60.8 87.4 62 87 63.4 88C63.8 84 62 80.5 58 80Z" fill={magenta} />
      <Path d="M58 80C56 81 55.2 84 55.6 87.6C56.4 87.4 56.8 88 56.6 89C57 85 57.4 82 58 80Z" fill={magentaLight} />
      <Circle cx="58.4" cy="89.6" r="1.3" fill={gold} />

      <Path d="M58 104C54 105 46 105.5 38 108.5C47 109 56 108 63 106ZM81 102.5C89 104 98 105 106 109C96 109.5 87 107.5 79 105Z" fill={barkMid} />
      <Path d="M68 105C67 109 64 112 60 114.5C66 114.5 70.5 111 72.5 106Z" fill={barkLight} />
      <Path
        d="M59 104.5C65 99 67.5 90 66.5 81C65.5 72 60 64 56 56C54 51.5 53.5 47 55 43L63.5 41.5C63 47 64.5 52 68.5 58C71.5 53 76 50.5 81 50C77.5 54 74.5 59 74 66C73.5 76 75.5 90 83 102.5C77 105.5 66 106 59 104.5Z"
        fill={barkMid}
      />
      <Path
        d="M59 104.5C65 99 67.5 90 66.5 81C65.5 72 60 64 56 56C54 51.5 53.5 47 55 43L58.4 42.5C58.2 48 60.5 54 64 61C67.5 68 69.5 76 69 85C68.6 93 66.5 100 64 105.2C62 105.2 60.3 105 59 104.5Z"
        fill={barkLight}
      />
      <Path d="M72.5 101C69.5 93 71.5 84 70.5 76C69.8 70 66.5 64 63 59" fill="none" stroke={bark} strokeWidth="2" strokeLinecap="round" />
      <Path d="M64 96C66 90 64.5 84 62.5 78" fill="none" stroke={barkMid} strokeWidth="1.2" strokeLinecap="round" />

      <Path d={PANDEN_GEOMETRY.snakeBody} fill={snake} />
      <Path d={PANDEN_GEOMETRY.snakeBelly} fill={belly} />

      <Path d={PANDEN_GEOMETRY.branch} fill={barkMid} />
      <Path d={PANDEN_GEOMETRY.twig} fill={barkMid} />
      <G fill="none" stroke={barkMid} strokeLinecap="round">
        <Path d="M59 44C57.5 37 58.5 31 56.5 24" strokeWidth="3.6" />
        <Path d="M57 51C49 46 40 43 29 39" strokeWidth="2.8" />
        <Path d="M78 51C82 47 85 45 89 42.5" strokeWidth="2.6" />
        <Path d="M57.2 30C52 27 47 24 42 22" strokeWidth="1.8" />
      </G>

      <Path d={pads.bDeep} fill={rim} transform="translate(0 -1.3)" />
      <Path d={pads.bDeep} fill={leafDeep} />
      <Path d={pads.b} fill={leaf} />
      <Path d={pads.bLight} fill={leafMid} />
      <Path d={pads.cDeep} fill={rim} transform="translate(0 -1.3)" />
      <Path d={pads.cDeep} fill={leafDeep} />
      <Path d={pads.c} fill={leaf} />
      <Path d={pads.cLight} fill={leafMid} />
      <Path d={pads.aDeep} fill={rim} transform="translate(0 -1.5)" />
      <Path d={pads.aDeep} fill={leafDeep} />
      <Path d={pads.a} fill={leaf} />
      <Path d={pads.aLight} fill={leafMid} />
      <Path d="M40 12C44 10 50 9.6 55 10.6C50 11.6 45 12.6 41.5 13.8C40 14.2 39 13 40 12Z" fill={leafLight} />
      {CANOPY_BLOSSOMS.map((spot) => (
        <Blossom key={spot.x} {...spot} petal={blossom} core={gold} />
      ))}

      <G fill="none" stroke={leafLight} strokeWidth="1.5" strokeLinecap="round">
        <Path d="M27 19C22 17 20.5 12 23.5 10C26 8.6 28.4 10.8 27 12.8C26 14 24.4 13.2 24.9 12" />
        <Path d="M5.5 37C2 34 2.5 29 6 28.4C8.6 28 9.8 31 8 32.4C7 33.2 5.8 32.4 6.3 31.4" />
        <Path d="M104 40C108 37 112.5 38.5 112 42C111.6 44.6 108.4 44.6 108.3 42.6C108.2 41.4 109.5 41 110 41.8" />
      </G>
      <Path
        d="M13 42C12 48 13.5 53 12.5 58M27 43.5C27.5 48 26.5 51 27.5 55M44 25C44.5 30 43.5 33 44.5 37"
        fill="none"
        stroke={leafMid}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <G fill={goldLight} opacity=".6">
        <Circle cx="12.5" cy="59.2" r="2.8" />
        <Circle cx="27.5" cy="56.2" r="2.4" />
        <Circle cx="44.5" cy="38.2" r="2.4" />
      </G>
      <G fill={gold}>
        <Circle cx="12.5" cy="59.2" r="1.4" />
        <Circle cx="27.5" cy="56.2" r="1.2" />
        <Circle cx="44.5" cy="38.2" r="1.2" />
        <Circle cx="66" cy="12" r="1.4" />
        <Circle cx="92" cy="37" r="1.2" />
      </G>

      {PANDEN_GEOMETRY.snakeFrontBodies.map((body) => (
        <Path key={body.slice(0, 16)} d={body} fill={snake} />
      ))}
      {PANDEN_GEOMETRY.snakeFrontBellies.map((snakeBelly) => (
        <Path key={snakeBelly.slice(0, 16)} d={snakeBelly} fill={belly} />
      ))}
      <G fill={snakeDeep} opacity=".75">
        {PANDEN_GEOMETRY.snakeSpots.map((spot) => (
          <Ellipse
            key={spot.x + '-' + spot.y}
            cx={spot.x}
            cy={spot.y}
            rx={spot.rx}
            ry={spot.ry}
            transform={'rotate(' + spot.angle + ' ' + spot.x + ' ' + spot.y + ')'}
          />
        ))}
      </G>
      <G transform={'translate(' + snakeHead.x + ' ' + snakeHead.y + ') rotate(' + snakeHead.angle + ')'}>
        <Path d="M-2.2 -2.6C1.4 -3.6 5.2 -2.6 7 -0.4C5.4 2 1.6 3.2 -2.2 2.6C-3 1.2 -3 -1.2 -2.2 -2.6Z" fill={snake} />
        <Path d="M-1.6 1.4C1.6 2.2 4.4 1.6 6.4 0.4C5 2.2 1.6 3 -1.8 2.4Z" fill={belly} />
        <Path d="M1.2 -1.9C2.2 -2.6 3.4 -2.5 4.1 -1.6C3.3 -1 2.2 -0.9 1.2 -1.9Z" fill={gold} />
        <Path d="M1.3 -1.85C2.2 -2.3 3.3 -2.25 4 -1.65" fill="none" stroke={snakeDeep} strokeWidth="0.6" strokeLinecap="round" />
      </G>

      <Path d="M133.5 55.5C133.8 57 134 58.2 134 59.6" fill="none" stroke={bark} strokeWidth="0.9" strokeLinecap="round" />
      <Circle cx="134" cy="64" r="9.5" fill={goldLight} opacity=".6" />
      <G transform="translate(134 64) scale(1.12) translate(-134 -64)">
        <Path
          d="M134 60C131.5 58.6 128.4 59.8 128.4 63.4C128.4 66.8 130.8 69.4 132.4 69.4C133.2 69.4 133.5 69 134 69C134.5 69 134.8 69.4 135.6 69.4C137.2 69.4 139.6 66.8 139.6 63.4C139.6 59.8 136.5 58.6 134 60Z"
          fill="url(#panden-fruit)"
        />
        <Path d="M130 60.4C128.5 61.6 128 64 128.9 66.6C129.1 64.2 129.4 62.3 130 60.4Z" fill={rim} opacity=".85" />
        <Ellipse cx="131.4" cy="62.4" rx="1.1" ry="1.8" fill={palette.white} opacity=".85" />
        <Circle cx="130.9" cy="65.2" r="0.45" fill={palette.white} opacity=".7" />
        <Path d="M134.2 58.6C136 56.6 138.6 56.6 139.8 57.6C138.2 59.4 136 59.8 134.2 58.6Z" fill={leafMid} />
        <Path d="M133.4 57.4C131.8 55.4 129.2 55.2 128 56.2C129.4 58 131.6 58.6 133.4 57.4Z" fill={leaf} />
      </G>
      {!locked && <Sparkle x={142} y={58} size={0.55} fill={gold} />}

      <Path d="M106 104C107 97 106 92 108.5 87" fill="none" stroke={moss} strokeWidth="1.8" strokeLinecap="round" />
      <G transform="translate(110 80)">
        <G fill={magenta}>
          {BLOOM_BLADE_ANGLES.map((angle) => (
            <Path key={angle} d={BLOOM_BLADE} transform={'rotate(' + angle + ')'} />
          ))}
        </G>
        <G fill={magentaLight} transform="rotate(18) scale(0.72)">
          {BLOOM_BLADE_ANGLES.map((angle) => (
            <Path key={angle} d={BLOOM_BLADE} transform={'rotate(' + angle + ')'} />
          ))}
        </G>
        <Circle r="7.4" fill={bloomHeart} />
        {PANDEN_GEOMETRY.seeds.map((seed) => (
          <Ellipse
            key={seed.x + '-' + seed.y}
            cx={seed.x}
            cy={seed.y}
            rx={seed.rx}
            ry={seed.ry}
            fill={seed.fill}
            transform={'rotate(' + seed.angle + ' ' + seed.x + ' ' + seed.y + ')'}
          />
        ))}
      </G>

      <Path d="M141 103C142 97 140 92 142.5 86.5" fill="none" stroke={moss} strokeWidth="1.4" strokeLinecap="round" />
      <G transform="translate(143 82) rotate(-12) scale(0.95)">
        <G fill={coral}>
          {WHIRL_BLADE_ANGLES.map((angle) => (
            <Path key={angle} d={WHIRL_BLADE} transform={'rotate(' + angle + ')'} />
          ))}
        </G>
        <Circle r="2.6" fill={gold} />
        <Path d={SPIRAL_PATH} fill="none" stroke={berry} strokeWidth="0.7" strokeLinecap="round" transform="scale(0.9)" />
      </G>

      {!locked && (
        <G fill={goldLight}>
          <Circle cx="100" cy="72" r="1" />
          <Circle cx="150" cy="70" r="0.9" />
          <Circle cx="8" cy="64" r="0.9" />
          <Circle cx="88" cy="36" r="0.8" />
        </G>
      )}
    </G>
  );
}

// Nenúfar en perspectiva con su muesca (ángulos en grados, sentido de las agujas).
function lilyPadPath(cx: number, cy: number, rx: number, ry: number, notch: number) {
  const point = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180;
    return (cx + Math.cos(radians) * rx).toFixed(1) + ' ' + (cy + Math.sin(radians) * ry).toFixed(1);
  };
  return 'M' + cx + ' ' + cy + 'L' + point(notch + 16) + 'A' + rx + ' ' + ry + ' 0 1 1 ' + point(notch - 16) + 'Z';
}

const POND_SHAPE = 'M58 96C60 89 72 86 84 88C94 85 108 86 116 91C124 95 126 102 120 107C114 112 100 113 88 111C76 113 62 111 56 106C52 103 55 99 58 96Z';
const POND_LILY_PAD = lilyPadPath(72, 104.5, 6.4, 2.5, 300);
const POND_LILY_PAD_LIGHT = lilyPadPath(71.5, 104.1, 4, 1.5, 300);
const BAMBOO_STALKS = [
  { x: 13, top: 17, width: 5.6 },
  { x: 21.6, top: 7, width: 6 },
  { x: 30.6, top: 29, width: 5.2 },
];
// Penachos en las puntas y alguna hoja suelta a media caña.
const BAMBOO_LEAVES = [
  { x: 24.6, y: 10, angle: -158, scale: 1 },
  { x: 24.6, y: 10.4, angle: -24, scale: 1 },
  { x: 24.6, y: 11, angle: 14, scale: 0.85 },
  { x: 15.8, y: 20, angle: -148, scale: 0.9 },
  { x: 15.8, y: 20.6, angle: 172, scale: 0.8 },
  { x: 33.2, y: 32, angle: -34, scale: 0.9 },
  { x: 33.2, y: 32.6, angle: 8, scale: 0.8 },
  { x: 27.4, y: 46, angle: 18, scale: 0.8 },
  { x: 27.4, y: 46.4, angle: -12, scale: 0.7 },
];
const BAMBOO_SHOOT = 'M0 0C-2.6 -0.2 -3 -4.4 -0.7 -9.6C-0.2 -10.6 0.3 -10.6 0.8 -9.6C3 -4.4 2.6 -0.2 0 0Z';
const BAMBOO_LEAF = 'M0 0C4 -2.4 10 -2.6 15 -1C10 0.6 4 1 0 0Z';

function PondFlower({ x, y, size, petal, core }: { x: number; y: number; size: number; petal: string; core: string }) {
  return (
    <G transform={'translate(' + x + ' ' + y + ') scale(' + size + ')'}>
      {FIVE_PETALS.map((angle) => (
        <Ellipse key={angle} cy="-1.9" rx="1.25" ry="1.7" fill={petal} transform={'rotate(' + angle + ')'} />
      ))}
      <Circle r="0.95" fill={core} />
    </G>
  );
}

// Estanque de Pandoro: el refugio tranquilo donde empieza el viaje. Un estanque de
// forma orgánica junto a un bosquecito de bambú, dos piedras lisas, florecitas y un
// nenúfar flotando. La zona superior derecha queda libre para Pandoro.
function PondScene({ vivid }: { vivid: boolean }) {
  const groundTop = vivid ? '#C3E2AA' : '#C7DEB1';
  const groundLight = vivid ? '#D4EBBF' : '#D5E7C5';
  const groundSide = vivid ? '#98C686' : '#9EC28E';
  const bank = vivid ? '#9CCB8A' : '#A1C691';
  const waterTop = vivid ? '#D2F1F5' : '#D2EDF0';
  const water = vivid ? '#94D4E8' : '#9BD0E1';
  const waterDeep = vivid ? '#68B9DA' : '#72B7D3';
  const ripple = vivid ? '#E9FAFC' : '#E7F6F8';
  const bamboo = vivid ? '#8FC77E' : '#95C385';
  const bambooLight = vivid ? '#C6E6AC' : '#C7E1B2';
  const bambooNode = vivid ? '#6CAC66' : '#72A96D';
  const bambooLeaf = vivid ? '#7CC284' : '#82BD89';
  const bambooLeafDeep = vivid ? '#56A36E' : '#5E9F74';
  const shoot = vivid ? '#B5D885' : '#B7D38D';
  const shootBand = vivid ? '#8FBF69' : '#93BA70';
  const pad = vivid ? '#79C18A' : '#7FBC8D';
  const padLight = vivid ? '#A4DAA2' : '#A7D4A5';
  const stone = vivid ? '#CFC6DE' : '#CDC6DA';
  const stoneShade = vivid ? '#B4A9CA' : '#B3AAC6';
  const stoneLight = vivid ? '#EEE9F6' : '#ECE8F3';
  const blossom = vivid ? '#F6B3C9' : '#EFB7C9';
  const blossomCore = vivid ? '#FFE7AE' : '#F8E4B6';
  const stem = vivid ? '#7DBB82' : '#82B686';

  return (
    <G>
      <Defs>
        <RadialGradient id="pond-water" cx="0.46" cy="0.3" r="0.8">
          <Stop offset="0" stopColor={waterTop} />
          <Stop offset="0.5" stopColor={water} />
          <Stop offset="1" stopColor={waterDeep} />
        </RadialGradient>
      </Defs>

      <Ellipse cx="85" cy="104" rx="78" ry="18" fill="#6E8F66" opacity=".14" />
      <Path d="M11 101C14 113 48 124 85 124S156 113 159 101A74 16 0 0 1 11 101Z" fill={groundSide} />
      <Ellipse cx="85" cy="101" rx="74" ry="16" fill={groundTop} />
      <Ellipse cx="82" cy="98" rx="60" ry="10.5" fill={groundLight} />

      {BAMBOO_STALKS.map((stalk) => (
        <G key={stalk.x}>
          <Rect x={stalk.x} y={stalk.top} width={stalk.width} height={103 - stalk.top} rx={stalk.width / 2} fill={bamboo} />
          <Rect x={stalk.x + 0.8} y={stalk.top + 2} width="1.1" height={99 - stalk.top} rx="0.55" fill={bambooLight} />
          {[0, 1, 2, 3, 4, 5, 6].map((node) => {
            const y = stalk.top + 11 + node * 13;
            return y < 99 ? (
              <Rect key={node} x={stalk.x - 0.4} y={y} width={stalk.width + 0.8} height="1.4" rx="0.7" fill={bambooNode} />
            ) : null;
          })}
        </G>
      ))}
      {BAMBOO_LEAVES.map((leaf, index) => (
        <Path
          key={leaf.y}
          d={BAMBOO_LEAF}
          fill={index % 2 === 0 ? bambooLeaf : bambooLeafDeep}
          transform={'translate(' + leaf.x + ' ' + leaf.y + ') rotate(' + leaf.angle + ') scale(' + leaf.scale + ')'}
        />
      ))}
      {[{ x: 41, y: 104.4, scale: 1 }, { x: 46.6, y: 106, scale: 0.72 }].map((sprout) => (
        <G key={sprout.x} transform={'translate(' + sprout.x + ' ' + sprout.y + ') scale(' + sprout.scale + ')'}>
          <Path d={BAMBOO_SHOOT} fill={shoot} />
          <Path d="M-2.2 -2.6Q0 -1.6 2.2 -2.6M-1.6 -5.8Q0 -4.9 1.6 -5.8" fill="none" stroke={shootBand} strokeWidth="0.8" strokeLinecap="round" />
        </G>
      ))}

      <Path d={POND_SHAPE} fill={bank} transform="translate(0 -1.4)" />
      <Path d={POND_SHAPE} fill="url(#pond-water)" />
      <G fill="none" stroke={ripple} strokeWidth="0.9" strokeLinecap="round">
        <Path d="M80 94Q82 92.6 84 94T88 94" />
        <Path d="M96 99Q98 97.6 100 99T104 99T108 99" />
        <Path d="M84 105Q86 103.6 88 105T92 105" />
      </G>

      <Path d={POND_LILY_PAD} fill={pad} />
      <Path d={POND_LILY_PAD_LIGHT} fill={padLight} />
      <G transform="translate(72.4 103)">
        <Ellipse cx="-1.6" cy="-1.2" rx="1.2" ry="2.1" fill={blossom} transform="rotate(-30 -1.6 -1.2)" />
        <Ellipse cx="1.6" cy="-1.2" rx="1.2" ry="2.1" fill={blossom} transform="rotate(30 1.6 -1.2)" />
        <Ellipse cy="-1.8" rx="1.2" ry="2.2" fill={blossom} />
        <Circle cy="-0.6" r="0.8" fill={blossomCore} />
      </G>

      <Ellipse cx="118.4" cy="90.4" rx="6.6" ry="4.8" fill={stoneShade} />
      <Ellipse cx="118" cy="89.2" rx="6.2" ry="4.4" fill={stone} />
      <Ellipse cx="116.2" cy="87.6" rx="2.6" ry="1.4" fill={stoneLight} />
      <Ellipse cx="127.2" cy="92.4" rx="4.8" ry="3.6" fill={stoneShade} />
      <Ellipse cx="126.9" cy="91.5" rx="4.4" ry="3.2" fill={stone} />
      <Ellipse cx="125.8" cy="90.3" rx="1.8" ry="0.9" fill={stoneLight} />

      <Path d="M132 113C132 111 132.2 109.6 132.6 108.4M141.6 108.6C141.6 106.8 141.8 105.4 142.2 104.2" fill="none" stroke={stem} strokeWidth="0.9" strokeLinecap="round" />
      <Path d="M132.2 111C134 109.6 135.8 109.6 137 110.4C135.6 111.6 133.8 111.8 132.2 111Z" fill={stem} />
      <PondFlower x={132.6} y={107.2} size={1.45} petal={blossom} core={blossomCore} />
      <PondFlower x={142.2} y={103.2} size={1.15} petal={blossom} core={blossomCore} />

      <G fill={palette.white} opacity=".9">
        <Path d="M100 92.6Q100.3 94 101.6 94.3Q100.3 94.6 100 96Q99.7 94.6 98.4 94.3Q99.7 94 100 92.6Z" />
        <Path d="M64 98.4Q64.2 99.4 65.2 99.6Q64.2 99.8 64 100.8Q63.8 99.8 62.8 99.6Q63.8 99.4 64 98.4Z" />
      </G>
    </G>
  );
}

function LandmarkScene({ landmark, status, isNext, zoom }: LandmarkSceneProps) {
  const locked = status === 'locked';
  const vivid = !locked || isNext;

  return (
    <Svg width={154 * zoom} height={120 * zoom} viewBox="0 0 170 128">
      {landmark === 'pond' && <PondScene vivid={vivid} />}

      {landmark === 'origamiForest' && (
        <OrigamiForestScene vivid={vivid} locked={locked} />
      )}

      {landmark === 'venusHouse' && (
        <VenusHouseScene vivid={vivid} locked={locked} />
      )}

      {landmark === 'ghostRoses' && (
        <GhostRoseScene vivid={vivid} locked={locked} />
      )}

      {landmark === 'starValley' && (
        <StarValleyScene vivid={vivid} locked={locked} />
      )}

      {landmark === 'panden' && (
        <PandenScene vivid={vivid} locked={locked} />
      )}
    </Svg>
  );
}

function PawStamp({ inset }: { inset: number }) {
  return (
    <View style={[styles.pawStamp, { right: 12 + inset }]}>
      <View style={[styles.toe, styles.toeLeft]} />
      <View style={[styles.toe, styles.toeCenter]} />
      <View style={[styles.toe, styles.toeRight]} />
      <View style={styles.pad} />
    </View>
  );
}

export function ProgressLandmark({
  stage,
  worldWidth,
  blooming = false,
  onPress,
}: ProgressLandmarkProps) {
  const pop = useSharedValue(1);

  useEffect(() => {
    if (!blooming) return;
    pop.value = withSequence(
      withTiming(0.92, { duration: 140 }),
      withSpring(1.1, { damping: 7, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 140 }),
    );
  }, [blooming, pop]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  const scale = worldWidth / PROGRESS_WORLD_WIDTH;
  const zoom = getLandmarkZoom(worldWidth);
  const nodeWidth = NODE_WIDTH * zoom;
  const nodeHeight = NODE_HEIGHT * zoom;
  // Las insignias conservan su posición previa al zoom para no salirse por el borde.
  const badgeInset = (nodeWidth - NODE_WIDTH) / 2;
  const centerX = stage.x * scale;
  const locked = stage.status === 'locked';
  const stateLabel = stage.status === 'completed'
    ? 'lugar recorrido'
    : stage.status === 'current'
      ? 'ubicación actual'
      : stage.isNext
        ? 'próxima parada'
        : 'por descubrir';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={stage.title + ', ' + stateLabel}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        {
          width: nodeWidth,
          height: nodeHeight,
          left: centerX - nodeWidth / 2,
          top: stage.y - nodeHeight / 2,
        },
        pressed && styles.pressed,
      ]}
    >
      {stage.isNext ? (
        <View style={[styles.nextFlag, { right: 6 + badgeInset }]}>
          <Text style={styles.nextFlagText}>Siguiente</Text>
        </View>
      ) : null}
      {blooming ? <LandmarkBloom width={nodeWidth} height={nodeHeight} /> : null}
      <Animated.View style={[styles.scene, popStyle]}>
        <LandmarkScene
          landmark={stage.landmark}
          status={stage.status}
          isNext={stage.isNext}
          zoom={zoom}
        />
      </Animated.View>
      {stage.status === 'completed' ? <PawStamp inset={badgeInset} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  scene: {
    transformOrigin: 'bottom',
  },
  nextFlag: {
    position: 'absolute',
    top: 0,
    right: 6,
    minHeight: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.small,
    backgroundColor: palette.yellowSoft,
    borderWidth: 1,
    borderColor: 'rgba(196, 154, 81, 0.3)',
    zIndex: 2,
  },
  nextFlagText: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    color: palette.yellowDeep,
  },
  pawStamp: {
    position: 'absolute',
    top: 9,
    right: 12,
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(100, 139, 115, 0.22)',
  },
  toe: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.greenDeep,
  },
  toeLeft: {
    top: 7,
    left: 5,
  },
  toeCenter: {
    top: 4,
    left: 12,
  },
  toeRight: {
    top: 7,
    right: 4,
  },
  pad: {
    position: 'absolute',
    left: 8,
    bottom: 5,
    width: 13,
    height: 10,
    borderRadius: 7,
    backgroundColor: palette.greenDeep,
  },
});
