import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PandoroHead, type PandoroHeadVariant } from '@/components/art/PandoroHead';
import { PaginationDots } from '@/components/onboarding/PaginationDots';
import { PrimaryButton } from '@/components/onboarding/PrimaryButton';
import { palette } from '@/theme/palette';
import { typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type OnboardingPage = {
  id: string;
  title: string;
  description: string;
  variant: PandoroHeadVariant;
  backgroundColor: string;
};

const PAGES: readonly OnboardingPage[] = [
  {
    id: 'welcome',
    title: 'PANDORO',
    description: 'Un panda que te echa una pata con los pendientes.',
    variant: 'splash',
    backgroundColor: palette.onboardingSky,
  },
  {
    id: 'organize',
    title: 'Anota lo que te ronda la cabeza',
    description: 'El informe, el correo que llevas días posponiendo, las compras. Todo en una sola lista.',
    variant: 'pink',
    backgroundColor: palette.onboardingSkyPink,
  },
  {
    id: 'prioritize',
    title: 'Empieza por una sola cosa',
    description: 'En «Ahora», Pandoro pone arriba la tarea que conviene hacer primero. Las demás pueden esperar.',
    variant: 'blue',
    backgroundColor: palette.onboardingSkyBlue,
  },
  {
    id: 'progress',
    title: 'Cada tarea es un paso',
    description: 'Al terminarlas, Pandoro recorre su mundo: del estanque al bosque de origami, y después a sitios más raros.',
    variant: 'yellow',
    backgroundColor: palette.onboardingSkyYellow,
  },
];

export function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const activePage = PAGES[activeIndex];
  const pandoroSize = Math.min(width * 0.64, height * 0.3, 260);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(PAGES.length - 1, nextIndex)));
  };

  const renderPage: ListRenderItem<OnboardingPage> = ({ item }) => (
    <View
      style={[
        styles.page,
        {
          width,
          height: Math.max(480, height - 160),
          backgroundColor: item.backgroundColor,
        },
      ]}
    >
      <View style={styles.artArea}>
        <Animated.View entering={ZoomIn.duration(220)}>
          <PandoroHead size={pandoroSize} variant={item.variant} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.duration(220)} style={styles.copyArea}>
        <Text style={[styles.title, item.id === 'welcome' && styles.brandTitle]}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activePage.backgroundColor }]}>
      <FlatList
        key={width}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.carousel}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      <View style={[styles.footer, { backgroundColor: activePage.backgroundColor }]}>
        <PaginationDots activeIndex={activeIndex} total={PAGES.length} />
        <View style={styles.actions}>
          <PrimaryButton
            label="Crear cuenta"
            onPress={() => router.push('/register')}
          />
          <PrimaryButton
            label="Iniciar sesión"
            variant="text"
            onPress={() => router.push('/login')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ui.space.xl,
    paddingBottom: 24,
  },
  artArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  copyArea: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typeScale.title,
    maxWidth: 340,
    color: palette.ink,
    textAlign: 'left',
  },
  brandTitle: {
    ...typeScale.brand,
  },
  description: {
    ...typeScale.body,
    maxWidth: 330,
    marginTop: 14,
    color: palette.inkSoft,
    textAlign: 'left',
  },
  footer: {
    width: '100%',
    maxWidth: 468,
    alignSelf: 'center',
    paddingHorizontal: ui.space.xl,
    paddingTop: 8,
    paddingBottom: 18,
    gap: ui.space.md,
  },
  actions: {
    gap: ui.space.xs,
  },
});
