import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { logError } from '@/services/logging/appLog';
import { palette } from '@/theme/palette';

type Props = { children: ReactNode };
type State = { failed: boolean };

// Si una pantalla falla al dibujarse, se registra el error (saneado) y se ofrece reintentar
// en lugar de dejar la app en blanco.
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    logError('render_error', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.body}>Pandoro tropezó. Tus tareas guardadas siguen a salvo.</Text>
        <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false })} style={styles.button}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: palette.cream },
  title: { fontSize: 20, color: palette.lilacDeep, textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center' },
  button: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: palette.lilacDeep },
  buttonText: { color: palette.cream, fontSize: 15 },
});
