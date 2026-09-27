import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@/theme/palette';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.cream,
  },
});
