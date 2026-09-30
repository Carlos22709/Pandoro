import Svg, { Path } from 'react-native-svg';

import {
  PROGRESS_WORLD_HEIGHT,
  PROGRESS_WORLD_WIDTH,
  type ProgressWorldStage,
} from '@/components/progress/worldData';
import { palette } from '@/theme/palette';

type ProgressPathProps = {
  currentStage: number;
  stages: ProgressWorldStage[];
  zoom: number;
};

// El sendero empieza y termina al pie del primer y del último lugar, dentro de su
// suelo, y no en su centro. Distancia a zoom 1 desde el centro del lugar; esos tramos
// acaban en corte recto para que el remate quede escondido bajo el escenario.
const TRAIL_END_DROP = 51;

function segmentPath(from: ProgressWorldStage, to: ProgressWorldStage, startY = from.y, endY = to.y) {
  const middleY = (startY + endY) / 2;
  return [
    'M', from.x, startY,
    'C', from.x, middleY,
    to.x, middleY,
    to.x, endY,
  ].join(' ');
}

export function ProgressPath({ currentStage, stages, zoom }: ProgressPathProps) {
  const orderedStages = [...stages].sort((a, b) => a.id - b.id);
  const lastIndex = orderedStages.length - 2;
  const drop = TRAIL_END_DROP * zoom;
  const segments = orderedStages.slice(0, -1).map((from, index) => {
    const to = orderedStages[index + 1];
    const isFirst = index === 0;
    const isFinal = index === lastIndex;
    return {
      from,
      to,
      d: segmentPath(from, to, isFirst ? from.y + drop : from.y, isFinal ? to.y + drop : to.y),
      linecap: isFirst || isFinal ? ('butt' as const) : ('round' as const),
    };
  });

  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height="100%"
      viewBox={'0 0 ' + PROGRESS_WORLD_WIDTH + ' ' + PROGRESS_WORLD_HEIGHT}
      preserveAspectRatio="none"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {segments.map(({ to, d, linecap }) => (
        <Path
          key={'edge-' + to.id}
          d={d}
          fill="none"
          stroke="#8FA77B"
          strokeWidth="48"
          strokeLinecap={linecap}
          opacity=".24"
        />
      ))}

      {segments.map(({ to, d, linecap }) => (
        <Path
          key={'ground-' + to.id}
          d={d}
          fill="none"
          stroke={palette.creamStrong}
          strokeWidth="40"
          strokeLinecap={linecap}
          opacity=".98"
        />
      ))}

      {segments.map(({ to, d, linecap }) => {
        const completed = to.id < currentStage;
        const current = to.id === currentStage;

        return (
          <Path
            key={'trail-' + to.id}
            d={d}
            fill="none"
            stroke={current ? '#F5D28D' : completed ? palette.cream : '#E9DFC8'}
            strokeWidth="26"
            strokeLinecap={linecap}
            opacity={completed || current ? 1 : 0.94}
          />
        );
      })}
    </Svg>
  );
}
