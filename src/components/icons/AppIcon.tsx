import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

export type AppIconName =
  | 'home'
  | 'checklist'
  | 'sprout'
  | 'profile'
  | 'settings'
  | 'plus'
  | 'back'
  | 'document'
  | 'mail'
  | 'book'
  | 'presentation'
  | 'cart'
  | 'phone'
  | 'play'
  | 'edit'
  | 'trash'
  | 'close';

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
      {name === 'settings' && (
        <>
          <Circle cx="16" cy="16" r="9" {...common} />
          <Circle cx="16" cy="16" r="3.5" {...common} />
          <Line x1="16" y1="3" x2="16" y2="7" {...common} />
          <Line x1="16" y1="25" x2="16" y2="29" {...common} />
          <Line x1="3" y1="16" x2="7" y2="16" {...common} />
          <Line x1="25" y1="16" x2="29" y2="16" {...common} />
          <Line x1="7" y1="7" x2="10" y2="10" {...common} />
          <Line x1="22" y1="22" x2="25" y2="25" {...common} />
          <Line x1="25" y1="7" x2="22" y2="10" {...common} />
          <Line x1="10" y1="22" x2="7" y2="25" {...common} />
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
      {name === 'document' && (
        <>
          <Path d="M9 4h10l5 5v19H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" {...common} />
          <Path d="M19 4v6h5M11 16h8M11 21h8" {...common} />
        </>
      )}
      {name === 'mail' && (
        <>
          <Path d="M5 8h22v17H5Z" {...common} />
          <Path d="m6 10 10 8 10-8" {...common} />
        </>
      )}
      {name === 'book' && (
        <>
          <Path d="M16 8c-3-3-7-4-11-3v20c4-1 8 0 11 3Z" {...common} />
          <Path d="M16 8c3-3 7-4 11-3v20c-4-1-8 0-11 3Z" {...common} />
        </>
      )}
      {name === 'presentation' && (
        <>
          <Path d="M5 6h22v15H5Z" {...common} />
          <Path d="M16 21v6M11 27h10M10 16l4-4 3 3 5-5" {...common} />
        </>
      )}
      {name === 'cart' && (
        <>
          <Path d="M4 6h3l3 14h13l4-10H8" {...common} />
          <Circle cx="12" cy="25" r="2" {...common} />
          <Circle cx="22" cy="25" r="2" {...common} />
        </>
      )}
      {name === 'phone' && (
        <Path d="M10 5 6 8c1 9 9 17 18 18l3-4-6-4-3 3c-4-2-7-5-9-9l3-3Z" {...common} />
      )}
      {name === 'play' && <Path d="m11 7 14 9-14 9Z" {...common} />}
      {name === 'edit' && (
        <>
          <Path d="M7 25l2-7L22 5l5 5-13 13Z" {...common} />
          <Path d="m19 8 5 5M7 27h19" {...common} />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path d="M7 9h18M12 9V5h8v4M10 9l1 18h10l1-18" {...common} />
          <Path d="M14 14v8M18 14v8" {...common} />
        </>
      )}
      {name === 'close' && (
        <>
          <Line x1="8" y1="8" x2="24" y2="24" {...common} />
          <Line x1="24" y1="8" x2="8" y2="24" {...common} />
        </>
      )}
    </Svg>
  );
}
