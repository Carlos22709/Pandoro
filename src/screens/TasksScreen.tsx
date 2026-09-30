import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { ForestScene } from '@/components/art/ForestScene';
import { Pandoro } from '@/components/art/Pandoro';
import { AppIcon } from '@/components/icons/AppIcon';
import { PROGRESS_WORLD_STAGES } from '@/components/progress/worldData';
import { PawToggle } from '@/components/tasks/PawToggle';
import { TaskBottomSheet } from '@/components/tasks/TaskBottomSheet';
import { TaskCelebration } from '@/components/tasks/TaskCelebration';
import { TASK_DIFFICULTY, type TaskDraft, type TaskItem } from '@/components/tasks/taskTypes';
import { useDemo } from '@/demo/DemoProvider';
import { DEMO_CELEBRATION_TITLES, DEMO_DEFAULT_CELEBRATION_TITLE } from '@/demo/demoScript';
import { sortTasksForNow } from '@/demo/demoState';
import { palette, toneColors } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type TasksView = 'now' | 'all';

type SegmentControlProps = {
  value: TasksView;
  onChange: (value: TasksView) => void;
};

function SegmentControl({ value, onChange }: SegmentControlProps) {
  return (
    <View accessibilityRole="tablist" style={styles.segmentControl}>
      {([
        ['now', 'Ahora'],
        ['all', 'Todas'],
      ] as const).map(([key, label]) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(key)}
            style={({ pressed }) => [styles.segment, active && styles.activeSegment, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, active && styles.activeSegmentText]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PandaGrip() {
  return (
    <View pointerEvents="none" style={styles.guide}>
      <Svg width="122" height="46" viewBox="0 0 122 46">
        <Ellipse cx="49" cy="24" rx="20" ry="14" fill={palette.pandaDark} transform="rotate(-8 49 24)" />
        <Ellipse cx="96" cy="23" rx="20" ry="14" fill={palette.pandaDark} transform="rotate(7 96 23)" />
        <Ellipse cx="48" cy="25" rx="7" ry="5.5" fill={palette.pink} opacity=".9" />
        <Circle cx="38" cy="20" r="3" fill={palette.pink} />
        <Circle cx="46" cy="16" r="3" fill={palette.pink} />
        <Circle cx="55" cy="18" r="3" fill={palette.pink} />
        <Ellipse cx="96" cy="24" rx="7" ry="5.5" fill={palette.pink} opacity=".9" />
        <Circle cx="86" cy="19" r="3" fill={palette.pink} />
        <Circle cx="95" cy="15" r="3" fill={palette.pink} />
        <Circle cx="104" cy="18" r="3" fill={palette.pink} />
      </Svg>
    </View>
  );
}

type TaskRowProps = {
  task: TaskItem;
  index: number;
  featured: boolean;
  started: boolean;
  onOpen: () => void;
  onToggle: () => void;
};

function TaskRow({ task, index, featured, started, onOpen, onToggle }: TaskRowProps) {
  const difficulty = TASK_DIFFICULTY[task.difficulty];
  const difficultyColors = toneColors[difficulty.tone];

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 7) * 45).springify().damping(18)}
    >
      <View
        style={[
          styles.taskRow,
          featured && styles.featuredRow,
        ]}
      >
        <Pressable onPress={onOpen} style={({ pressed }) => [styles.taskBody, pressed && styles.rowPressed]}>
          <View style={[styles.taskAccent, { backgroundColor: difficultyColors.main }]} />
          <View style={styles.taskIcon}>
            <AppIcon name={task.icon} color={difficultyColors.deep} size={21} strokeWidth={2.1} />
          </View>
          <View style={styles.taskCopy}>
            <View style={styles.taskTitleLine}>
              <Text numberOfLines={1} style={[styles.taskTitle, task.completed && styles.completedTitle]}>
                {task.title}
              </Text>
              <View style={styles.difficultyBadge}>
                <View style={[styles.difficultyDot, { backgroundColor: difficultyColors.deep }]} />
                <Text style={[styles.difficultyText, { color: difficultyColors.deep }]}>{difficulty.label}</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.taskDetail, started && styles.startedDetail]}>
              {started ? 'En curso · ' : ''}{task.detail}
            </Text>
          </View>
        </Pressable>
        <PawToggle
          checked={task.completed}
          onPress={onToggle}
          accessibilityLabel={task.completed ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`}
          size={32}
        />
      </View>
    </Animated.View>
  );
}

export function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    tasks,
    progress,
    celebration,
    toggleTask,
    createTask: addTask,
    updateTask,
    deleteTask: removeTask,
    dismissCelebration,
  } = useDemo();
  const [view, setView] = useState<TasksView>('now');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [startedTaskId, setStartedTaskId] = useState<string | null>(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  const visibleTasks = useMemo(() => (view === 'all' ? tasks : sortTasksForNow(tasks)), [tasks, view]);

  const priorityTaskId = view === 'now' ? visibleTasks[0]?.id : undefined;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  // La celebración espera a que la patita termine de rebotar y la lista se acomode.
  useEffect(() => {
    if (!celebration) {
      setCelebrationVisible(false);
      return;
    }
    setSheetVisible(false);
    setCreating(false);
    const timer = setTimeout(() => setCelebrationVisible(true), 650);
    return () => clearTimeout(timer);
  }, [celebration]);

  const closeSheet = () => {
    setSheetVisible(false);
    setCreating(false);
  };

  const openTask = (id: string) => {
    setSelectedTaskId(id);
    setCreating(false);
    setSheetVisible(true);
  };

  const createTask = () => {
    setSelectedTaskId(null);
    setCreating(true);
    setSheetVisible(true);
  };

  const saveTask = (draft: TaskDraft) => {
    if (creating) {
      addTask(draft);
      closeSheet();
      return;
    }

    if (!selectedTaskId) return;
    updateTask(selectedTaskId, draft);
  };

  const deleteTask = (id: string) => {
    removeTask(id);
    if (startedTaskId === id) setStartedTaskId(null);
    closeSheet();
  };

  const seeWorld = () => {
    dismissCelebration();
    router.navigate('/progreso');
  };

  const startTask = (id: string) => {
    setStartedTaskId(id);
    closeSheet();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.backgroundArt}>
        <ForestScene />
      </View>
      <View pointerEvents="none" style={styles.backgroundWash} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 8) + 91,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Tareas</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear tarea"
            onPress={createTask}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <AppIcon name="plus" color={palette.lilacDeep} size={25} strokeWidth={2.6} />
          </Pressable>
        </View>

        <SegmentControl value={view} onChange={setView} />

        <View style={styles.immersiveStage}>
          {visibleTasks.length ? (
            <View pointerEvents="none" style={styles.pandaBehind}>
              <Pandoro size={150} />
            </View>
          ) : null}

          <View style={[styles.listPanel, visibleTasks.length > 0 && styles.guidedListPanel]}>
            <FlatList
              data={visibleTasks}
              keyExtractor={(task) => `${view}-${task.id}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                visibleTasks.length > 0 && styles.guidedListContent,
                !visibleTasks.length && styles.emptyListContent,
              ]}
              renderItem={({ item, index }) => (
                <TaskRow
                  task={item}
                  index={index}
                  featured={item.id === priorityTaskId}
                  started={item.id === startedTaskId}
                  onOpen={() => openTask(item.id)}
                  onToggle={() => toggleTask(item.id)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={(
                <View style={styles.emptyState}>
                  <PawToggle checked onPress={() => undefined} accessibilityLabel="Sin tareas pendientes" size={50} />
                  <Text style={styles.emptyTitle}>Nada pendiente. Pandoro se va a la siesta.</Text>
                </View>
              )}
            />
          </View>

          {visibleTasks.length ? (
            <View pointerEvents="none" style={styles.floatingGuide}>
              <PandaGrip />
            </View>
          ) : null}
        </View>
      </View>

      <TaskBottomSheet
        visible={sheetVisible}
        task={selectedTask}
        creating={creating}
        started={selectedTask?.id === startedTaskId}
        onClose={closeSheet}
        onToggle={toggleTask}
        onStart={startTask}
        onDelete={deleteTask}
        onSave={saveTask}
      />

      <TaskCelebration
        visible={celebrationVisible && celebration !== null}
        title={(celebration && DEMO_CELEBRATION_TITLES[celebration.taskId]) ?? DEMO_DEFAULT_CELEBRATION_TITLE}
        completedTasks={progress.completedTasks}
        placeName={PROGRESS_WORLD_STAGES.find((stage) => stage.id === celebration?.stageId)?.title ?? ''}
        onSeeWorld={seeWorld}
        onClose={dismissCelebration}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
    backgroundColor: palette.sky,
  },
  backgroundArt: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.56,
  },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(247, 250, 244, 0.48)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  titleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  screenTitle: {
    ...typeScale.title,
    color: palette.ink,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: ui.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 245, 0.9)',
    borderWidth: 1,
    borderColor: ui.surface.borderStrong,
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.97 }],
  },
  segmentControl: {
    width: 214,
    height: 38,
    flexDirection: 'row',
    padding: 4,
    marginTop: 7,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 4,
    borderRadius: ui.radius.control,
    backgroundColor: 'rgba(255, 252, 245, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.1)',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeSegment: {
    backgroundColor: 'rgba(201, 184, 234, 0.78)',
  },
  segmentText: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    color: palette.inkSoft,
  },
  activeSegmentText: {
    color: palette.ink,
  },
  immersiveStage: {
    flex: 1,
    position: 'relative',
  },
  pandaBehind: {
    position: 'absolute',
    top: -6,
    left: 8,
    zIndex: 1,
  },
  floatingGuide: {
    position: 'absolute',
    top: 87,
    left: 13,
    zIndex: 4,
  },
  listPanel: {
    flex: 1,
    zIndex: 2,
    minHeight: 210,
    overflow: 'hidden',
    borderRadius: ui.radius.panel,
    backgroundColor: 'rgba(255, 252, 245, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.12)',
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  guidedListPanel: {
    marginTop: 108,
  },
  listContent: {
    padding: 8,
    paddingBottom: 14,
  },
  guidedListContent: {
    paddingTop: 18,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  separator: {
    height: 5,
  },
  taskRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 7,
    borderRadius: ui.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.09)',
    backgroundColor: 'rgba(255, 253, 249, 0.98)',
  },
  featuredRow: {
    minHeight: 60,
    borderColor: 'rgba(117, 101, 127, 0.19)',
  },
  taskBody: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowPressed: {
    opacity: 0.67,
  },
  taskAccent: {
    width: 3,
    height: 24,
    borderRadius: 2,
    marginRight: 8,
  },
  taskIcon: {
    width: 25,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  taskCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  taskTitleLine: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTitle: {
    ...typeScale.body,
    fontFamily: fonts.bold,
    lineHeight: 20,
    flex: 1,
    minWidth: 0,
    color: palette.ink,
  },
  completedTitle: {
    color: palette.inkSoft,
    textDecorationLine: 'line-through',
  },
  difficultyBadge: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  difficultyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  difficultyText: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
  },
  taskDetail: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    marginTop: 2,
    color: palette.inkSoft,
  },
  startedDetail: {
    fontFamily: fonts.bold,
    color: palette.greenDeep,
  },
  guide: {
    width: 122,
    height: 46,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    ...typeScale.body,
    fontFamily: fonts.display,
    maxWidth: 240,
    color: palette.ink,
    textAlign: 'center',
  },
});
