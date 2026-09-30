import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';

// Archivos que carga src/app/_layout.tsx antes de mostrar la app.
export const fontAssets = {
  Fraunces_600SemiBold,
  Figtree_400Regular,
  Figtree_600SemiBold,
  Figtree_700Bold,
};

// Cada peso es una familia propia. No combinar con fontWeight: en Android una fuente
// cargada con fontWeight no elige el archivo del peso y cae en la del sistema.
export const fonts = {
  // Fraunces: serif suave, con aire de cuento, para títulos y cifras.
  display: 'Fraunces_600SemiBold',
  // Figtree: texto de interfaz.
  regular: 'Figtree_400Regular',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

// Escala única: tres tamaños de texto y dos de título, más la marca.
// Los de texto usan Figtree Regular; cada estilo cambia la familia si necesita otro peso.
export const typeScale = {
  brand: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: 1.4 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} as const;
