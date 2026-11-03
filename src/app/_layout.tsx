import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { ConsentGate, useConsentStatus } from '@/components/auth/ConsentGate';
import { RemindersProvider } from '@/components/reminders/RemindersProvider';
import { TasksProvider } from '@/components/tasks/TasksProvider';
import { DemoProvider } from '@/demo/DemoProvider';
import { installGlobalErrorCapture, logEvent } from '@/services/logging/appLog';
import { palette } from '@/theme/palette';
import { fontAssets } from '@/theme/typography';

installGlobalErrorCapture();
logEvent('app_started');

const PUBLIC_ROUTES: (string | undefined)[] = [undefined, 'login', 'register'];

function AppStack() {
  const { status, user } = useAuth();
  const consent = useConsentStatus(status === 'signedIn' ? user?.uid ?? null : null);
  const router = useRouter();
  const firstSegment = useSegments()[0];
  const pathname = usePathname();

  useEffect(() => {
    logEvent('screen_view', { screen: pathname });
  }, [pathname]);

  const onPublicRoute = PUBLIC_ROUTES.includes(firstSegment);
  const redirectTo = status === 'signedIn' && onPublicRoute
    ? '/inicio'
    : status === 'signedOut' && !onPublicRoute
      ? '/login'
      : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  const consentRequired = status === 'signedIn' && !redirectTo && consent === 'missing';

  return (
    <>
      {/* Con ConsentGate encima, la app de abajo no recibe toques ni la leen los lectores de pantalla. */}
      <View
        style={styles.root}
        aria-hidden={consentRequired}
        importantForAccessibility={consentRequired ? 'no-hide-descendants' : 'auto'}
        pointerEvents={consentRequired ? 'none' : 'auto'}
      >
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="hablar" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="nueva-tarea" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </View>
      {/* Cubre la pantalla mientras se comprueba la sesión o se redirige: 'loading' no equivale a sin sesión. */}
      {status === 'loading' || redirectTo || (status === 'signedIn' && consent === 'checking') ? (
        <View accessibilityLabel="Comprobando tu sesión" style={styles.loading}>
          <ActivityIndicator color={palette.lilacDeep} size="large" />
        </View>
      ) : null}
      {/* Ley 1581: sin constancia de autorización no se entra; ConsentGate la pide de nuevo. */}
      {consentRequired ? (
        <View style={styles.gate}>
          <ConsentGate />
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
    <AppErrorBoundary>
    <SafeAreaProvider>
      <AuthProvider>
        <TasksProvider>
          <RemindersProvider>
          {/* Las tareas viven en TasksProvider; la demo lleva el progreso del mundo y el guion de Hablar. */}
          <DemoProvider>
            <View style={styles.root}>
              <StatusBar style="dark" />
              <AppStack />
            </View>
          </DemoProvider>
          </RemindersProvider>
        </TasksProvider>
      </AuthProvider>
    </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  gate: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.cream,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
