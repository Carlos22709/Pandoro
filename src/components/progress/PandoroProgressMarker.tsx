import { StyleSheet, View } from 'react-native';

import { Pandoro } from '@/components/art/Pandoro';
import { PROGRESS_WORLD_WIDTH, getLandmarkZoom } from '@/components/progress/worldData';

type PandoroProgressMarkerProps = {
  x: number;
  y: number;
  worldWidth: number;
};

const MARKER_WIDTH = 126;
const MARKER_HEIGHT = 144;

export function PandoroProgressMarker({
  x,
  y,
  worldWidth,
}: PandoroProgressMarkerProps) {
  const scale = worldWidth / PROGRESS_WORLD_WIDTH;
  const zoom = getLandmarkZoom(worldWidth);
  const centerX = x * scale;
  const left = Math.min(
    worldWidth - MARKER_WIDTH,
    Math.max(0, centerX - MARKER_WIDTH / 2 + (40 * zoom * scale)),
  );

  return (
    <View
      pointerEvents="none"
      accessibilityLabel="Pandoro está en la ubicación actual"
      style={[
        styles.container,
        {
          left,
          top: y - MARKER_HEIGHT - 18 * zoom,
        },
      ]}
    >
      <Pandoro size={108} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: MARKER_WIDTH,
    height: MARKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 7,
  },
});
