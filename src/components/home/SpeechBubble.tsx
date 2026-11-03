import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';

type SpeechBubbleProps = {
  text: string;
  bottomOffset: number;
};

export function SpeechBubble({ text, bottomOffset }: SpeechBubbleProps) {
  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="none">
      <Animated.View key={text} entering={FadeIn.duration(320)}>
        <View style={styles.bubble}>
          <Text style={styles.text}>{text}</Text>
        </View>
        <View style={styles.tail} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 3,
  },
  bubble: {
    maxWidth: 178,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(81, 64, 93, 0.1)',
  },
  // Lo que dice Pandoro va en la tipografía de los títulos: es su voz, no la de la interfaz.
  text: {
    ...typeScale.body,
    fontFamily: fonts.display,
    lineHeight: 21,
    color: palette.ink,
    textAlign: 'left',
  },
  tail: {
    width: 12,
    height: 12,
    marginTop: -6,
    marginLeft: 24,
    backgroundColor: palette.cream,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(81, 64, 93, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
});
