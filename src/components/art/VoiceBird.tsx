import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

type VoiceBirdProps = { size?: number };

export function VoiceBird({ size = 58 }: VoiceBirdProps) {
  const svgId = useId().replace(/:/g, '');
  const bodyGradientId = `${svgId}-bird-body`;
  const wingGradientId = `${svgId}-bird-wing`;

  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" accessibilityLabel="Pajarito">
      <Defs>
        <RadialGradient id={bodyGradientId} cx="40%" cy="30%" rx="68%" ry="76%">
          <Stop offset="0%" stopColor="#FFF9EC" />
          <Stop offset="72%" stopColor="#FFF1D9" />
          <Stop offset="100%" stopColor="#EDD9C5" />
        </RadialGradient>
        <LinearGradient id={wingGradientId} x1="15%" y1="10%" x2="85%" y2="90%">
          <Stop offset="0%" stopColor="#B4CCF2" />
          <Stop offset="60%" stopColor="#9DBAEA" />
          <Stop offset="100%" stopColor="#819FD8" />
        </LinearGradient>
      </Defs>

      <Path d="M21 42C13 42 8 38 7 31C14 31 20 33 25 38Z" fill="#7899D0" />
      <Path d="M20 47C12 50 7 48 4 43C11 39 18 39 25 42Z" fill="#8EABE0" />

      <Path
        d="M18 43C14 34 18 25 27 20C36 15 49 18 56 26C63 34 62 45 55 52C47 60 34 61 24 55C19 52 16 48 18 43Z"
        fill={`url(#${bodyGradientId})`}
      />
      <Path
        d="M24 29C31 24 41 26 45 34C48 41 43 49 34 53C27 50 22 42 22 35C22 32 22 31 24 29Z"
        fill={`url(#${wingGradientId})`}
      />
      <Path
        d="M29 34C33 31 38 32 40 36C42 40 39 44 35 47"
        fill="none"
        stroke="#7899D0"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.58}
      />

      <Ellipse cx="49" cy="44" rx="8" ry="6" fill="#FFF7E9" opacity={0.72} />
      <Ellipse cx="53" cy="40" rx="4.5" ry="3" fill="#F2AFAC" opacity={0.52} />
      <Circle cx="51" cy="31" r="2.6" fill="#49394E" />
      <Circle cx="50.2" cy="30.2" r="0.8" fill="#FFF8EA" />
      <Path d="M57 34C62 35 66 38 68 41C63 42 59 42 56 41Z" fill="#D98A67" />

      <Path
        d="M29 58c3 2 6 2 9 0m7-1c2 2 5 2 8 0"
        fill="none"
        stroke="#6C5260"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <Path
        d="M49 17v-7m8 10 5-5"
        fill="none"
        stroke="#F0C76F"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
