import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { palette, type PaletteTone, toneColors } from '@/theme/palette';

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const tabs: Record<string, { label: string; icon: AppIconName; tone: PaletteTone }> = {
  inicio: { label: 'Inicio', icon: 'home', tone: 'green' },
  tareas: { label: 'Tareas', icon: 'checklist', tone: 'lilac' },
  progreso: { label: 'Progreso', icon: 'sprout', tone: 'yellow' },
  perfil: { label: 'Perfil', icon: 'profile', tone: 'pink' },
};

export function BottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.positioner, { paddingBottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <View pointerEvents="none" style={styles.barWash} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const config = tabs[route.name];
          const colors = toneColors[config.tone];
          const label = descriptors[route.key]?.options.title ?? config.label;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={String(label)}
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
            >
              <View
                style={[
                  styles.activePill,
                  focused && styles.activePillFocused,
                  focused && { backgroundColor: colors.soft, borderColor: colors.main },
                ]}
              >
                <AppIcon
                  name={config.icon}
                  size={focused ? 27 : 25}
                  color={focused ? colors.deep : colors.main}
                  strokeWidth={focused ? 2.7 : 2.35}
                />
              </View>
              <Text style={[styles.label, { color: focused ? colors.deep : palette.inkSoft }, focused && styles.activeLabel]}>
                {String(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
  },
  bar: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    borderRadius: 29,
    backgroundColor: palette.cream,
    borderWidth: 1,
    borderColor: 'rgba(123, 91, 104, 0.12)',
    shadowColor: '#675866',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 9,
    elevation: 4,
  },
  barWash: {
    position: 'absolute',
    top: 7,
    left: 18,
    right: 18,
    height: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 17,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 15,
    backgroundColor: palette.white,
    opacity: 0.52,
  },
  tab: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 54,
    height: 36,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 21,
    borderBottomLeftRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillFocused: {
    shadowColor: palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  label: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '700',
  },
});
