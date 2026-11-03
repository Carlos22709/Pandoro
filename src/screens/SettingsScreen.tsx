import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { AppIcon } from '@/components/icons/AppIcon';
import { useTasks } from '@/components/tasks/TasksProvider';
import { useDemo } from '@/demo/DemoProvider';
import { savePreferences, watchPreferences } from '@/services/data/userRepository';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

type Preferences = {
  darkMode: boolean;
  reduceMotion: boolean;
  taskReminders: boolean;
  weeklySummary: boolean;
  pandoroTips: boolean;
  sounds: boolean;
  haptics: boolean;
  usageAnalytics: boolean;
};

type PreferenceKey = keyof Preferences;

type SettingsColors = {
  background: string;
  wash: string;
  header: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  switchOff: string;
};

const DEFAULT_PREFERENCES: Preferences = {
  darkMode: false,
  reduceMotion: true,
  taskReminders: true,
  weeklySummary: true,
  pandoroTips: true,
  sounds: false,
  haptics: true,
  usageAnalytics: false,
};

const LIGHT_COLORS: SettingsColors = {
  background: '#EAF4F0',
  wash: 'rgba(244, 248, 240, 0.76)',
  header: 'rgba(239, 247, 238, 0.92)',
  surface: ui.surface.base,
  text: palette.ink,
  muted: palette.inkSoft,
  border: ui.surface.border,
  accent: palette.lilacDeep,
  switchOff: '#D7D0DA',
};

const DARK_COLORS: SettingsColors = {
  background: '#211C27',
  wash: 'rgba(28, 24, 34, 0.84)',
  header: 'rgba(33, 28, 39, 0.96)',
  surface: '#302936',
  text: '#F8F1FA',
  muted: '#C7BBCB',
  border: 'rgba(248, 241, 250, 0.12)',
  accent: '#C9B8EA',
  switchOff: '#5D5364',
};

type PreferenceRowProps = {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: SettingsColors;
  last?: boolean;
};

function PreferenceRow({
  title,
  description,
  value,
  onValueChange,
  colors,
  last = false,
}: PreferenceRowProps) {
  return (
    <View style={[styles.preferenceRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={styles.preferenceCopy}>
        <Text style={[styles.preferenceTitle, { color: colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[styles.preferenceDescription, { color: colors.muted }]}>{description}</Text>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        aria-checked={value}
        onPress={() => onValueChange(!value)}
        style={({ pressed }) => [
          styles.toggle,
          { backgroundColor: value ? colors.accent : colors.switchOff },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </Pressable>
    </View>
  );
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const uid = user?.uid ?? null;
  const { submit, submitting, error } = useAuthSubmit();
  const { resetDemo } = useDemo();
  const { resetTasks } = useTasks();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [demoReset, setDemoReset] = useState<'idle' | 'confirming' | 'done'>('idle');
  const colors = preferences.darkMode ? DARK_COLORS : LIGHT_COLORS;

  // Reiniciar pide un segundo toque para no borrar la demo por accidente.
  useEffect(() => {
    if (demoReset === 'idle') return;
    const timer = setTimeout(() => setDemoReset('idle'), demoReset === 'confirming' ? 3000 : 2000);
    return () => clearTimeout(timer);
  }, [demoReset]);

  const pressResetDemo = () => {
    if (demoReset !== 'confirming') {
      setDemoReset('confirming');
      return;
    }
    resetDemo();
    resetTasks();
    setDemoReset('done');
  };

  // Al cerrar sesión, la protección de rutas de _layout lleva a Iniciar sesión.
  const logOut = () => submit({ action: signOut });

  // Las preferencias viven en users/{uid}; lo que falte toma el valor por defecto.
  useEffect(() => {
    if (!uid) return;
    return watchPreferences(uid, (saved) => {
      const known = Object.entries(saved).filter(([key]) => key in DEFAULT_PREFERENCES);
      setPreferences({ ...DEFAULT_PREFERENCES, ...Object.fromEntries(known) });
    });
  }, [uid]);

  const persistPreferences = (next: Preferences) => {
    setPreferences(next);
    if (uid) {
      savePreferences(uid, next).catch((failure: Error) => (
        console.warn('No se pudieron guardar las preferencias.', failure.message)
      ));
    }
  };

  const updatePreference = (key: PreferenceKey, value: boolean) => {
    persistPreferences({ ...preferences, [key]: value });
  };

  const resetPreferences = () => persistPreferences(DEFAULT_PREFERENCES);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={preferences.darkMode ? 'light' : 'dark'} />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.scene, preferences.darkMode && styles.sceneDark]}
      >
        <ForestScene />
      </View>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.wash }]} />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.header,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>Ajustes</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <PreferenceRow
            title="Modo oscuro"
            value={preferences.darkMode}
            onValueChange={(value) => updatePreference('darkMode', value)}
            colors={colors}
          />
          <PreferenceRow
            title="Reducir movimiento"
            value={preferences.reduceMotion}
            onValueChange={(value) => updatePreference('reduceMotion', value)}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recordatorios</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <PreferenceRow
            title="Antes de cada tarea"
            description="Un aviso cuando se acerque la hora que anotaste."
            value={preferences.taskReminders}
            onValueChange={(value) => updatePreference('taskReminders', value)}
            colors={colors}
          />
          <PreferenceRow
            title="Resumen semanal"
            description="Cada domingo: tareas terminadas y hasta dónde llegó Pandoro."
            value={preferences.weeklySummary}
            onValueChange={(value) => updatePreference('weeklySummary', value)}
            colors={colors}
          />
          <PreferenceRow
            title="Mensajes de Pandoro"
            description="Lo que dice cuando terminas algo o llevas días sin pasar."
            value={preferences.pandoroTips}
            onValueChange={(value) => updatePreference('pandoroTips', value)}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sonido y vibración</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <PreferenceRow
            title="Sonidos"
            description="Un ruidito al marcar una tarea con la huella."
            value={preferences.sounds}
            onValueChange={(value) => updatePreference('sounds', value)}
            colors={colors}
          />
          <PreferenceRow
            title="Vibración"
            value={preferences.haptics}
            onValueChange={(value) => updatePreference('haptics', value)}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuenta y privacidad</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/perfil')}
            style={({ pressed }) => [styles.accountAction, pressed && styles.pressed]}
          >
            <AppIcon name="profile" color={colors.accent} size={22} strokeWidth={2.1} />
            <View style={styles.preferenceCopy}>
              <Text style={[styles.preferenceTitle, { color: colors.text }]}>Datos de la cuenta</Text>
              <Text style={[styles.preferenceDescription, { color: colors.muted }]}>
                Nombre y correo.
              </Text>
            </View>
          </Pressable>
          <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
          <PreferenceRow
            title="Analíticas de uso"
            description="Datos anónimos sobre cómo usas la app. Nunca el contenido de tus tareas."
            value={preferences.usageAnalytics}
            onValueChange={(value) => updatePreference('usageAnalytics', value)}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Demo</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={demoReset === 'confirming' ? 'Confirmar reinicio de la demo' : 'Reiniciar demo'}
            onPress={pressResetDemo}
            style={({ pressed }) => [styles.accountAction, pressed && styles.pressed]}
          >
            <AppIcon
              name="play"
              color={demoReset === 'confirming' ? palette.pinkDeep : colors.accent}
              size={22}
              strokeWidth={2.1}
            />
            <View style={styles.preferenceCopy}>
              <Text
                style={[
                  styles.preferenceTitle,
                  { color: demoReset === 'confirming' ? palette.pinkDeep : colors.text },
                ]}
              >
                {demoReset === 'confirming'
                  ? 'Toca otra vez para reiniciar'
                  : demoReset === 'done'
                    ? 'Demo reiniciada'
                    : 'Reiniciar demo'}
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.muted }]}>
                Vuelve las tareas, el progreso y el mundo de Pandoro al inicio de la presentación.
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restablecer preferencias"
          onPress={resetPreferences}
          style={({ pressed }) => [
            styles.resetButton,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.resetLabel, { color: colors.accent }]}>Restablecer preferencias</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          disabled={submitting}
          onPress={logOut}
          style={({ pressed }) => [
            styles.resetButton,
            { borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.resetLabel, { color: colors.accent }]}>
            {submitting ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Text>
        </Pressable>
        {error ? <Text style={[styles.prototypeNote, { color: colors.text }]}>{error}</Text> : null}
        <Text style={[styles.prototypeNote, { color: colors.muted }]}>
          En este prototipo, los cambios se conservan únicamente durante la sesión.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
  },
  scene: {
    opacity: 0.75,
  },
  sceneDark: {
    opacity: 0.28,
  },
  header: {
    minHeight: 66,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 7,
    borderBottomWidth: 1,
  },
  screenTitle: {
    ...typeScale.title,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 116,
  },
  sectionTitle: {
    ...typeScale.body,
    fontFamily: fonts.bold,
    marginTop: 5,
    marginBottom: 8,
  },
  sectionSurface: {
    marginBottom: 16,
    borderRadius: ui.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  preferenceRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    ...typeScale.body,
    fontFamily: fonts.semibold,
  },
  preferenceDescription: {
    ...typeScale.caption,
    lineHeight: 17,
    marginTop: 3,
  },
  toggle: {
    width: 44,
    height: 26,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 13,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },
  accountAction: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  innerDivider: {
    height: 1,
    marginHorizontal: 15,
  },
  resetButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
    borderWidth: 1,
  },
  resetLabel: {
    ...typeScale.small,
    fontFamily: fonts.bold,
  },
  prototypeNote: {
    ...typeScale.caption,
    marginTop: 10,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.66,
  },
});
