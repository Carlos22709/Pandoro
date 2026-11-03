import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { AppIcon } from '@/components/icons/AppIcon';
import { TASK_DIFFICULTY } from '@/components/tasks/taskTypes';
import { type DemoPlanTask, formatMinutes } from '@/demo/demoScript';
import { palette, toneColors } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type PlanCardProps = {
  plan: readonly DemoPlanTask[];
  // Filas visibles: el plan se va escribiendo fila a fila.
  visibleRows: number;
  added: boolean;
};

function AddedPaw() {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.paw} accessibilityLabel="Agregada">
      <Svg width={18} height={18} viewBox="0 0 34 34">
        <Circle cx="7.5" cy="11" r="3.3" fill={palette.greenDeep} />
        <Circle cx="14.2" cy="7" r="3.5" fill={palette.greenDeep} />
        <Circle cx="21.7" cy="7.8" r="3.4" fill={palette.greenDeep} />
        <Circle cx="27.3" cy="12.6" r="3.1" fill={palette.greenDeep} />
        <Ellipse cx="17.1" cy="23" rx="9.2" ry="7.4" fill={palette.greenDeep} />
      </Svg>
    </Animated.View>
  );
}

function PlanRow({ task, added }: { task: DemoPlanTask; added: boolean }) {
  const difficulty = TASK_DIFFICULTY[task.difficulty];
  const colors = toneColors[difficulty.tone];

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.row}>
      <View style={[styles.accent, { backgroundColor: colors.main }]} />
      <View style={styles.icon}>
        <AppIcon name={task.icon} color={colors.deep} size={20} strokeWidth={2.1} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>
          {task.duration}
          <Text style={styles.metaDivider}>  ·  </Text>
          <Text style={{ color: colors.deep }}>{difficulty.label}</Text>
        </Text>
      </View>
      {added ? <AddedPaw /> : null}
    </Animated.View>
  );
}

export function PlanCard({ plan, visibleRows, added }: PlanCardProps) {
  const totalMinutes = plan.reduce((total, task) => total + task.minutes, 0);
  const visible = plan.slice(0, visibleRows);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.heading}>Tu semana</Text>
        <Text style={styles.total}>{formatMinutes(totalMinutes)}</Text>
      </View>

      {visible.map((task, index) => {
        const startsDay = index === 0 || visible[index - 1].day !== task.day;
        return (
          <View key={task.id}>
            {startsDay ? (
              <Animated.Text entering={FadeIn.duration(220)} style={styles.day}>
                {task.day}
              </Animated.Text>
            ) : null}
            <PlanRow task={task} added={added} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderRadius: 18,
    borderTopLeftRadius: 6,
    backgroundColor: 'rgba(255, 253, 249, 0.98)',
    borderWidth: 1,
    borderColor: ui.surface.border,
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 9,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: ui.surface.border,
  },
  heading: {
    ...typeScale.body,
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.ink,
  },
  total: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    color: palette.inkSoft,
  },
  day: {
    ...typeScale.caption,
    fontFamily: fonts.bold,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 2,
    color: palette.inkSoft,
  },
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 6,
    paddingLeft: 7,
    paddingRight: 8,
    borderRadius: ui.radius.card,
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.09)',
    backgroundColor: palette.white,
  },
  accent: {
    width: 3,
    height: 26,
    borderRadius: 2,
    marginRight: 8,
  },
  icon: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    lineHeight: 18,
    color: palette.ink,
  },
  meta: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    marginTop: 2,
    color: palette.inkSoft,
  },
  metaDivider: {
    color: 'rgba(117, 101, 127, 0.5)',
  },
  paw: {
    marginLeft: 6,
  },
});
