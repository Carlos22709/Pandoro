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
import { type PaletteTone, palette } from '@/theme/palette';

type OnboardingTone = Extract<PaletteTone, 'pink' | 'lilac' | 'blue' | 'yellow'>;

type OnboardingPage = {
  id: string;
  title: string;
  description: string;
  variant: PandoroHeadVariant;
  tone: OnboardingTone;
  backgroundColor: string;
};

const PAGES: readonly OnboardingPage[] = [
  {
    id: 'welcome',
    title: 'PANDORO',
    description: 'Tu compañero para organizarte sin complicarte.',
    variant: 'splash',
    tone: 'pink',
    backgroundColor: palette.onboardingSky,
  },
  {
    id: 'organize',
    title: 'Organiza sin complicarte',
    description: 'Reúne tus tareas en un lugar sencillo, amable y hecho para ti.',
    variant: 'pink',
    tone: 'lilac',
    backgroundColor: palette.onboardingSkyPink,
  },
  {
    id: 'prioritize',
    title: 'Encuentra por dónde empezar',
    description: 'Pandoro te ayuda a ver lo importante y dar el siguiente paso.',
    variant: 'blue',
    tone: 'blue',
    backgroundColor: palette.onboardingSkyBlue,
  },
  {
    id: 'progress',
    title: 'Avanza a tu ritmo',
    description: 'Celebra cada pequeño progreso mientras construyes tu rutina.',
    variant: 'yellow',
    tone: 'yellow',
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
    <View style={[styles.page, { width, backgroundColor: item.backgroundColor }]}>
      <View style={styles.artArea}>
        <Animated.View entering={ZoomIn.duration(380)}>
          <PandoroHead size={pandoroSize} variant={item.variant} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.duration(420)} style={styles.copyArea}>
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
        <PaginationDots activeIndex={activeIndex} total={PAGES.length} tone={activePage.tone} />
        <View style={styles.actions}>
          <PrimaryButton
            label="Crear cuenta"
            tone={activePage.tone}
            onPress={() => router.push('/register')}
          />
          <PrimaryButton
            label="Iniciar sesión"
            tone={activePage.tone}
            variant="soft"
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
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  artArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 38,
  },
  copyArea: {
    alignItems: 'center',
  },
  title: {
    maxWidth: 340,
    color: palette.ink,
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: 1.6,
  },
  description: {
    maxWidth: 330,
    marginTop: 14,
    color: palette.inkSoft,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 16,
  },
  actions: {
    gap: 10,
  },
});
