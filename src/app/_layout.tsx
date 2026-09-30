import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoProvider } from '@/demo/DemoProvider';
import { palette } from '@/theme/palette';
import { fontAssets } from '@/theme/typography';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  // Si la carga falla, la app sigue con la fuente del sistema en lugar de quedarse en blanco.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.root} />;
  }

  return (
    <SafeAreaProvider>
      <DemoProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="hablar" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="nueva-tarea" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </View>
      </DemoProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.cream,
  },
});
