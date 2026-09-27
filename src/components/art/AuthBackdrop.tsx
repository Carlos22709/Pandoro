import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { palette } from '@/theme/palette';

type AuthBackdropProps = {
  // Color de la colina lejana; da a cada pantalla su tono sin cambiar la escena.
  hillColor: string;
};

// Escena mínima para las pantallas de acceso: una ramita de bambú y colinas suaves.
// Cada colina son dos capas desplazadas, como veladuras de acuarela.
export function AuthBackdrop({ hillColor }: AuthBackdropProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={styles.sprig} width={128} height={156} viewBox="0 0 128 156">
        <Path d="M122-6C112 34 104 70 100 112" fill="none" stroke="#9DBF8A" strokeWidth="5" strokeLinecap="round" opacity=".42" />
        <Ellipse cx="86" cy="40" rx="9" ry="31" transform="rotate(56 86 40)" fill="#A9C98E" opacity=".5" />
        <Ellipse cx="118" cy="70" rx="8" ry="27" transform="rotate(-40 118 70)" fill="#B7D39C" opacity=".46" />
        <Ellipse cx="76" cy="88" rx="8" ry="26" transform="rotate(66 76 88)" fill="#A9C98E" opacity=".4" />
      </Svg>

      <Svg style={styles.hills} width="100%" height={140} viewBox="0 0 390 176" preserveAspectRatio="none">
        <Path d="M0 88C58 56 116 60 168 80c52 20 100-20 152-22 32-1 54 8 70 16v102H0Z" fill={hillColor} opacity=".34" />
        <Path d="M0 102c52-24 104-26 150-8 54 20 112-12 162-14 38-1 60 8 78 16v80H0Z" fill={palette.lilac} opacity=".2" />
        <Path d="M0 130c70-24 142-20 206-6 66 14 124-4 184-14v66H0Z" fill={palette.greenSoft} opacity=".92" />
        <Path d="M0 144c80-20 150-14 214-4 66 10 122-4 176-12v48H0Z" fill={palette.green} opacity=".16" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  sprig: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  hills: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
