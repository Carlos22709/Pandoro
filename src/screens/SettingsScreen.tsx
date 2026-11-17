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
import { AuthInput } from '@/components/auth/AuthInput';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { RecentLoginRequiredError } from '@/services/auth/authService';
import { AppIcon } from '@/components/icons/AppIcon';
import { usePreferences } from '@/components/preferences/PreferencesProvider';
import { useTasks } from '@/components/tasks/TasksProvider';
import { useDemo } from '@/demo/DemoProvider';
import { PRESENTATION_MODE_AVAILABLE } from '@/demo/presentationMode';
import { useReminders } from '@/components/reminders/RemindersProvider';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

// Solo se muestran interruptores que cambian algo de verdad (revisión del 13 de noviembre).
// Modo oscuro, sonidos, vibración, resumen semanal y analíticas se retiraron hasta que existan.
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

const COLORS: SettingsColors = {
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
  const { signOut, deleteAccount } = useAuth();
  const { submit, submitting, error } = useAuthSubmit();
  const { resetDemo } = useDemo();
  const { resetTasks } = useTasks();
  const { preferences, setPreference, resetPreferences } = usePreferences();
  const reminders = useReminders();
  const [demoReset, setDemoReset] = useState<'idle' | 'confirming' | 'done'>('idle');
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirming' | 'reauth'>('idle');
  const [deletePassword, setDeletePassword] = useState('');
  const colors = COLORS;

  // Reiniciar pide un segundo toque para no borrar la demo por accidente.
  useEffect(() => {
    if (demoReset === 'idle') return;
    const timer = setTimeout(() => setDemoReset('idle'), demoReset === 'confirming' ? 3000 : 2000);
    return () => clearTimeout(timer);
  }, [demoReset]);

  // El segundo toque de borrar cuenta se cancela solo si no está pidiendo la contraseña.
  useEffect(() => {
    if (deleteStep !== 'confirming') return;
    const timer = setTimeout(() => setDeleteStep('idle'), 8000);
    return () => clearTimeout(timer);
  }, [deleteStep]);

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

  const cancelDelete = () => {
    setDeleteStep('idle');
    setDeletePassword('');
  };

  // Tras borrar la cuenta se va a la bienvenida, no a Iniciar sesión.
  const runDelete = (password?: string) => submit({
    problem: deleteStep === 'reauth' && !password?.trim() ? 'Escribe tu contraseña.' : null,
    action: async () => {
      try {
        await deleteAccount(password?.trim() ? password : undefined);
        cancelDelete();
        router.replace('/');
      } catch (failure) {
        if (failure instanceof RecentLoginRequiredError) {
          setDeleteStep('reauth');
        }
        throw failure;
      }
    },
  });

  const pressDeleteAccount = () => {
    if (deleteStep === 'reauth') {
      runDelete(deletePassword);
      return;
    }
    if (deleteStep !== 'confirming') {
      setDeleteStep('confirming');
      return;
    }
    runDelete();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.scene]}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Apariencia</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <PreferenceRow
            title="Reducir movimiento"
            description="Quita las animaciones de la app. Apagado, se sigue el ajuste de tu dispositivo."
            value={preferences.reducedMotion}
            onValueChange={(value) => setPreference('reducedMotion', value)}
            colors={colors}
          />
          <PreferenceRow
            title="Mensajes de Pandoro"
            description="El globo con lo que dice Pandoro en Inicio."
            value={preferences.pandoroBubble}
            onValueChange={(value) => setPreference('pandoroBubble', value)}
            colors={colors}
            last
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recordatorios</Text>
        <View style={[styles.sectionSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <PreferenceRow
            title="El día de cada tarea"
            description={reminders.supported
              ? reminders.status === 'denied'
                ? 'Activa las notificaciones de Pandask en los ajustes del teléfono para recibir avisos.'
                : 'Un aviso a las 8:00 a. m. el día de cada tarea planeada. No muestra el nombre de la tarea.'
              : 'En la web, Pandoro te cuenta al abrir la app qué tienes para hoy y mañana.'}
            value={reminders.enabled}
            onValueChange={reminders.setEnabled}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              deleteStep === 'reauth'
                ? 'Confirmar y borrar la cuenta'
                : deleteStep === 'confirming'
                  ? 'Confirmar: borrar mi cuenta y mis datos'
                  : 'Borrar mi cuenta y mis datos'
            }
            disabled={submitting}
            onPress={pressDeleteAccount}
            style={({ pressed }) => [styles.accountAction, styles.deleteAction, pressed && styles.pressed]}
          >
            <AppIcon
              name="trash"
              color={deleteStep === 'idle' ? colors.accent : palette.pinkDeep}
              size={22}
              strokeWidth={2.1}
            />
            <View style={styles.preferenceCopy}>
              <Text
                style={[
                  styles.preferenceTitle,
                  { color: deleteStep === 'idle' ? colors.text : palette.pinkDeep },
                ]}
              >
                {deleteStep === 'reauth'
                  ? 'Confirma con tu contraseña'
                  : deleteStep === 'confirming'
                    ? 'Toca otra vez para borrar todo'
                    : 'Borrar mi cuenta y mis datos'}
              </Text>
              <Text style={[styles.preferenceDescription, { color: colors.muted }]}>
                {deleteStep === 'reauth'
                  ? 'La sesión es antigua. Escribe tu contraseña para borrar tu cuenta, tus tareas, tu progreso y tus ajustes.'
                  : deleteStep === 'confirming'
                    ? 'Se borrarán tu cuenta, tus tareas, tu progreso y tus preferencias. No podrás recuperarlos.'
                    : 'Elimina tu correo, tus tareas, tu progreso y tus ajustes. Esta acción no se puede deshacer.'}
              </Text>
            </View>
          </Pressable>
          {deleteStep === 'reauth' ? (
            <View style={styles.deleteConfirm}>
              <AuthInput
                label="Contraseña"
                value={deletePassword}
                onChangeText={setDeletePassword}
                onSubmitEditing={() => runDelete(deletePassword)}
                placeholder="Tu contraseña"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                editable={!submitting}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirmar y borrar"
                disabled={submitting}
                onPress={() => runDelete(deletePassword)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { backgroundColor: palette.pinkDeep },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.deleteButtonLabel}>
                  {submitting ? 'Borrando tu cuenta…' : 'Confirmar y borrar'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                disabled={submitting}
                onPress={cancelDelete}
                style={({ pressed }) => [styles.cancelDelete, pressed && styles.pressed]}
              >
                <Text style={[styles.resetLabel, { color: colors.accent }]}>Cancelar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Reiniciar borra las tareas y el progreso de la cuenta: solo en builds de presentación. */}
        {PRESENTATION_MODE_AVAILABLE ? (
        <>
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
        </>
        ) : null}

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
          disabled={submitting || deleteStep !== 'idle'}
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
          Tus tareas, progreso y preferencias se guardan en tu cuenta.
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
  deleteAction: {
    borderTopColor: ui.surface.border,
    borderTopWidth: 1,
  },
  deleteConfirm: {
    gap: 10,
    paddingHorizontal: 15,
    paddingBottom: 14,
  },
  deleteButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
  },
  deleteButtonLabel: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    color: palette.white,
  },
  cancelDelete: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
