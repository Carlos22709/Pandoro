import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

export type AppIconName = 'home' | 'checklist' | 'sprout' | 'profile' | 'plus' | 'back';

type AppIconProps = {
  name: AppIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

export function AppIcon({ name, color, size = 28, strokeWidth = 2.4 }: AppIconProps) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {name === 'home' && (
        <>
          <Path d="m5 14 11-9 11 9v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" {...common} />
          <Path d="M12 28V18h8v10" {...common} />
        </>
      )}
      {name === 'checklist' && (
        <>
          <Path d="M10 5h13a4 4 0 0 1 4 4v15a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z" {...common} />
          <Path d="M13 5v4h8V5" {...common} />
          <Polyline points="11,15 13,17 17,12" {...common} />
          <Polyline points="11,22 13,24 17,19" {...common} />
          <Line x1="20" y1="15" x2="23" y2="15" {...common} />
          <Line x1="20" y1="22" x2="23" y2="22" {...common} />
        </>
      )}
      {name === 'sprout' && (
        <>
          <Path d="M16 28V14" {...common} />
          <Path d="M16 15C9 15 5 11 5 5c7 0 11 3 11 10Z" {...common} />
          <Path d="M16 19c0-7 4-11 11-11 0 7-4 11-11 11Z" {...common} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx="16" cy="10" r="6" {...common} />
          <Path d="M5 28c0-7 4-11 11-11s11 4 11 11" {...common} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Line x1="16" y1="6" x2="16" y2="26" {...common} />
          <Line x1="6" y1="16" x2="26" y2="16" {...common} />
        </>
      )}
      {name === 'back' && (
        <>
          <Path d="m18 7-9 9 9 9" {...common} />
          <Line x1="10" y1="16" x2="27" y2="16" {...common} />
        </>
      )}
    </Svg>
  );
}
