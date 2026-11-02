import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/icons/AppIcon';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

const tabs: Record<string, { label: string; icon: AppIconName }> = {
  inicio: { label: 'Inicio', icon: 'home' },
  tareas: { label: 'Tareas', icon: 'checklist' },
  progreso: { label: 'Progreso', icon: 'sprout' },
  perfil: { label: 'Perfil', icon: 'profile' },
  settings: { label: 'Ajustes', icon: 'settings' },
};

export function BottomNavigation({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.positioner, { paddingBottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const config = tabs[route.name];
          const label = descriptors[route.key]?.options.title ?? config.label;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
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
                ]}
              >
                <AppIcon
                  name={config.icon}
                  size={focused ? 25 : 23}
                  color={focused ? palette.lilacDeep : palette.inkSoft}
                  strokeWidth={focused ? 2.55 : 2.2}
                />
              </View>
              <Text style={[styles.label, focused && styles.activeLabel]}>
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
    paddingHorizontal: 8,
  },
  bar: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 250, 240, 0.98)',
    borderWidth: 1,
    borderColor: ui.surface.border,
    shadowColor: '#675866',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  tab: {
    flex: 1,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 42,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillFocused: {
    borderBottomWidth: 2,
    borderBottomColor: palette.lilacDeep,
  },
  label: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    marginTop: 2,
    color: palette.inkSoft,
  },
  activeLabel: {
    fontFamily: fonts.bold,
    color: palette.lilacDeep,
  },
});
