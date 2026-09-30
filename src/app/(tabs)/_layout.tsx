import { Tabs } from 'expo-router';

import { BottomNavigation } from '@/components/navigation/BottomNavigation';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="tareas" options={{ title: 'Tareas' }} />
      <Tabs.Screen name="progreso" options={{ title: 'Progreso' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
