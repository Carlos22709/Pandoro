import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/theme/palette';

export function SpeechBubble() {
  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View style={styles.bubble}>
        <View style={styles.wash} />
        <Text style={styles.text}>¿Qué te gustaría organizar hoy?</Text>
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-end',
    marginRight: 20,
    zIndex: 2,
  },
  bubble: {
    width: 202,
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 29,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(166, 136, 126, 0.1)',
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    top: -10,
    right: -12,
    width: 112,
    height: 58,
    borderRadius: 32,
    backgroundColor: palette.pinkSoft,
    opacity: 0.28,
    transform: [{ rotate: '5deg' }],
  },
  text: {
    zIndex: 1,
    color: palette.ink,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
  },
  tail: {
    width: 22,
    height: 22,
    marginLeft: 31,
    marginTop: -11,
    backgroundColor: palette.cream,
    borderBottomLeftRadius: 20,
    transform: [{ rotate: '34deg' }],
  },
});
