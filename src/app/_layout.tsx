import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { TasksProvider } from '@/components/tasks/TasksProvider';
import { DemoProvider } from '@/demo/DemoProvider';
import { palette } from '@/theme/palette';
import { fontAssets } from '@/theme/typography';

const PUBLIC_ROUTES: (string | undefined)[] = [undefined, 'login', 'register'];

function AppStack() {
  const { status } = useAuth();
  const router = useRouter();
  const firstSegment = useSegments()[0];

  const onPublicRoute = PUBLIC_ROUTES.includes(firstSegment);
  const redirectTo = status === 'signedIn' && onPublicRoute
    ? '/inicio'
    : status === 'signedOut' && !onPublicRoute
      ? '/login'
      : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="hablar" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="nueva-tarea" options={{ animation: 'slide_from_right' }} />
      </Stack>
      {/* Cubre la pantalla mientras se comprueba la sesión o se redirige: 'loading' no equivale a sin sesión. */}
      {status === 'loading' || redirectTo ? (
        <View accessibilityLabel="Comprobando tu sesión" style={styles.loading}>
          <ActivityIndicator color={palette.lilacDeep} size="large" />
        </View>
      ) : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Si la carga falla, la app sigue con la fuente del sistema en lugar de quedarse en blanco.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TasksProvider>
          {/* Las tareas viven en TasksProvider; la demo lleva el progreso del mundo y el guion de Hablar. */}
          <DemoProvider>
            <View style={styles.root}>
              <StatusBar style="dark" />
              <AppStack />
            </View>
          </DemoProvider>
        </TasksProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
