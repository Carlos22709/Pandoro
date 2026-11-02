import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressLandmarkSheet } from '@/components/progress/ProgressLandmarkSheet';
import { ProgressSummary } from '@/components/progress/ProgressSummary';
import { ProgressWorld } from '@/components/progress/ProgressWorld';
import {
  MOCK_WORLD_PROGRESS,
  buildProgressWorldStages,
  type ProgressWorldStage,
} from '@/components/progress/worldData';
import { palette } from '@/theme/palette';
import { typeScale } from '@/theme/typography';

type TabPressNavigation = {
  addListener: (event: 'tabPress', callback: () => void) => () => void;
};

export function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as TabPressNavigation;
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const positionedRef = useRef(false);
  const [selectedStage, setSelectedStage] = useState<ProgressWorldStage | null>(null);

  const stages = useMemo(() => buildProgressWorldStages(MOCK_WORLD_PROGRESS), []);
  const currentStage = stages.find((stage) => stage.status === 'current');

  const scrollToCurrentStage = useCallback((animated: boolean) => {
    if (!currentStage) return;
    scrollRef.current?.scrollTo({
      y: Math.max(0, currentStage.y - 350),
      animated,
    });
  }, [currentStage]);

  const positionWorldAtCurrentStage = useCallback(() => {
    if (positionedRef.current || !currentStage) return;
    positionedRef.current = true;
    scrollToCurrentStage(false);
  }, [currentStage, scrollToCurrentStage]);

  useFocusEffect(
    useCallback(() => {
      const frame = requestAnimationFrame(() => scrollToCurrentStage(false));
      return () => cancelAnimationFrame(frame);
    }, [scrollToCurrentStage]),
  );

  useEffect(() => {
    return navigation.addListener('tabPress', () => {
      requestAnimationFrame(() => scrollToCurrentStage(true));
    });
  }, [navigation, scrollToCurrentStage]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Progreso</Text>
          <ProgressSummary
            streak={MOCK_WORLD_PROGRESS.streak}
            completedTasks={MOCK_WORLD_PROGRESS.completedTasks}
          />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={positionWorldAtCurrentStage}
        >
          <ProgressWorld
            currentStage={MOCK_WORLD_PROGRESS.currentStage}
            stages={stages}
            onLandmarkPress={setSelectedStage}
          />
        </ScrollView>
      </View>

      <ProgressLandmarkSheet
        stage={selectedStage}
        completedTasks={MOCK_WORLD_PROGRESS.completedTasks}
        onClose={() => setSelectedStage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#B8D9A2',
  },
  content: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 6,
    backgroundColor: 'rgba(239, 247, 238, 0.98)',
    zIndex: 2,
  },
  title: {
    ...typeScale.title,
    color: palette.ink,
  },
});
