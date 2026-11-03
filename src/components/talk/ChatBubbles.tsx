import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PandoroHead } from '@/components/art/PandoroHead';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

export function PandoroAvatar({ size = 36 }: { size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <PandoroHead size={size * 0.84} />
    </View>
  );
}

type PandoroRowProps = {
  children: ReactNode;
  showAvatar?: boolean;
  // Las burbujas dejan aire a la derecha; la tarjeta del plan usa todo el ancho.
  wide?: boolean;
};

// Fila de Pandoro: cabecita a la izquierda y, a su lado, la burbuja o la tarjeta.
export function PandoroRow({ children, showAvatar = true, wide = false }: PandoroRowProps) {
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={[styles.pandoroRow, wide && styles.pandoroRowWide]}>
      <View style={styles.avatarSlot}>{showAvatar ? <PandoroAvatar /> : null}</View>
      <View style={styles.pandoroContent}>{children}</View>
    </Animated.View>
  );
}

// Lo que dice Pandoro va en Fraunces, como en la burbuja de Inicio: es su voz.
export function PandoroBubble({ text }: { text: string }) {
  return (
    <View style={styles.pandoroBubble}>
      <Text style={styles.pandoroText}>{text}</Text>
    </View>
  );
}

// Mientras el presentador mantiene pulsado, la transcripción se ve en borrador;
// al soltar queda confirmada con el color de la marca.
export function UserBubble({ text, live = false }: { text: string; live?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={styles.userRow}>
      <View style={[styles.userBubble, live && styles.userBubbleLive]}>
        <Text style={[styles.userText, live && styles.userTextLive]}>
          {text || ' '}
          {live ? <Text style={styles.caret}> ▍</Text> : null}
        </Text>
      </View>
    </Animated.View>
  );
}

function ThinkingDot({ delay }: { delay: number }) {
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 280 }), withTiming(0, { duration: 280 })), -1),
    );
  }, [delay, lift]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + lift.value * 0.6,
    transform: [{ translateY: -lift.value * 4 }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function ThinkingBubble() {
  return (
    <View style={[styles.pandoroBubble, styles.thinkingBubble]} accessibilityLabel="Pandoro está pensando">
      <ThinkingDot delay={0} />
      <ThinkingDot delay={150} />
      <ThinkingDot delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  pandoroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingRight: 28,
  },
  pandoroRowWide: {
    paddingRight: 0,
  },
  avatarSlot: {
    width: 36,
  },
  pandoroContent: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  pandoroBubble: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    backgroundColor: 'rgba(255, 250, 240, 0.97)',
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  pandoroText: {
    ...typeScale.body,
    fontFamily: fonts.display,
    lineHeight: 23,
    color: palette.ink,
  },
  thinkingBubble: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.lilacDeep,
  },
  userRow: {
    alignItems: 'flex-end',
    paddingLeft: 48,
  },
  userBubble: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: palette.lilacDeep,
    borderWidth: 1,
    borderColor: palette.lilacDeep,
  },
  userBubbleLive: {
    backgroundColor: 'rgba(238, 231, 248, 0.96)',
    borderColor: 'rgba(148, 123, 179, 0.35)',
    borderStyle: 'dashed',
  },
  userText: {
    ...typeScale.body,
    color: palette.white,
  },
  userTextLive: {
    color: palette.ink,
  },
  caret: {
    color: palette.lilacDeep,
  },
});
