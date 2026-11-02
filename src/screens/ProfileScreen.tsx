import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForestScene } from '@/components/art/ForestScene';
import { Pandoro } from '@/components/art/Pandoro';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAuthSubmit } from '@/components/auth/useAuthSubmit';
import { AppIcon } from '@/components/icons/AppIcon';
import { MOCK_WORLD_PROGRESS } from '@/components/progress/worldData';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.accountField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateName } = useAuth();
  const { submit, submitting, error } = useAuthSubmit();
  const displayName = user?.displayName || user?.email || '';
  const [draftName, setDraftName] = useState(displayName);
  const [editingAccount, setEditingAccount] = useState(false);

  const startEditing = () => {
    setDraftName(user?.displayName ?? '');
    setEditingAccount(true);
  };

  const cancelEditing = () => setEditingAccount(false);

  const saveAccount = () => submit({
    problem: draftName.trim() ? null : 'Escribe tu nombre.',
    action: async () => {
      await updateName(draftName);
      setEditingAccount(false);
    },
  });

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <ForestScene />
      </View>
      <View pointerEvents="none" style={styles.backgroundWash} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.screenTitle}>Perfil</Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.hero}>
            <View style={styles.avatarStage} accessibilityLabel="Pandoro, avatar fijo del perfil">
              <View style={styles.avatarGround} />
              <View style={styles.avatarCharacter}>
                <Pandoro size={136} />
              </View>
            </View>
            <Text style={styles.username}>{displayName}</Text>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitleInHeading}>Tu cuenta</Text>
            {!editingAccount && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar datos de cuenta"
                onPress={startEditing}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              >
                <AppIcon name="edit" color={palette.lilacDeep} size={17} strokeWidth={2.1} />
                <Text style={styles.editLabel}>Editar</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.accountSurface}>
            {!editingAccount ? (
              <>
                <AccountField label="Nombre" value={user?.displayName || 'Sin nombre'} />
                <View style={styles.accountDivider} />
                <AccountField label="Correo" value={user?.email ?? ''} />
              </>
            ) : (
              <View>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  accessibilityLabel="Nuevo nombre"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={40}
                  onChangeText={setDraftName}
                  placeholder="Tu nombre"
                  placeholderTextColor={palette.inkSoft}
                  returnKeyType="done"
                  value={draftName}
                  onSubmitEditing={saveAccount}
                  style={styles.input}
                />
                {error ? <Text style={styles.fieldLabel}>{error}</Text> : null}
                <View style={styles.editActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={cancelEditing}
                    style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.cancelLabel}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={saveAccount}
                    style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.saveLabel}>Guardar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Tu recorrido</Text>
          <View style={styles.statsSurface}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{MOCK_WORLD_PROGRESS.completedTasks}</Text>
              <Text style={styles.statLabel}>Tareas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{MOCK_WORLD_PROGRESS.streak}</Text>
              <Text style={styles.statLabel}>Días seguidos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{MOCK_WORLD_PROGRESS.currentStage}</Text>
              <Text style={styles.statLabel}>Lugares</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#EAF4F0',
  },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(244, 248, 240, 0.72)',
  },
  content: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 7,
    backgroundColor: 'rgba(239, 247, 238, 0.9)',
  },
  screenTitle: {
    ...typeScale.title,
    color: palette.ink,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 112,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 3,
    paddingBottom: 18,
  },
  avatarStage: {
    width: 166,
    height: 156,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarGround: {
    position: 'absolute',
    right: 22,
    bottom: 1,
    left: 22,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.lilacSoft,
    borderWidth: 1,
    borderColor: 'rgba(148, 123, 179, 0.18)',
  },
  avatarCharacter: {
    zIndex: 1,
  },
  username: {
    ...typeScale.heading,
    marginTop: 8,
    color: palette.ink,
  },
  sectionTitle: {
    ...typeScale.body,
    fontFamily: fonts.bold,
    marginTop: 6,
    marginBottom: 8,
    color: palette.ink,
  },
  sectionHeading: {
    minHeight: 42,
    marginTop: 2,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleInHeading: {
    ...typeScale.body,
    fontFamily: fonts.bold,
    color: palette.ink,
  },
  accountSurface: {
    padding: 16,
    borderRadius: ui.radius.card,
    backgroundColor: ui.surface.base,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  accountField: {
    minHeight: 42,
    justifyContent: 'center',
  },
  accountDivider: {
    height: 1,
    marginVertical: 9,
    backgroundColor: ui.surface.border,
  },
  fieldLabel: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
  fieldValue: {
    ...typeScale.body,
    fontFamily: fonts.semibold,
    marginTop: 3,
    color: palette.ink,
  },
  editButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: ui.radius.control,
  },
  editLabel: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    color: palette.lilacDeep,
  },
  input: {
    minHeight: 48,
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    borderRadius: ui.radius.control,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: ui.surface.borderStrong,
    color: palette.ink,
    fontFamily: fonts.semibold,
    fontSize: typeScale.body.fontSize,
  },
  editActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
  },
  cancelLabel: {
    ...typeScale.small,
    fontFamily: fonts.semibold,
    color: palette.inkSoft,
  },
  saveButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.control,
    backgroundColor: palette.lilacDeep,
  },
  saveLabel: {
    ...typeScale.small,
    fontFamily: fonts.bold,
    color: palette.white,
  },
  statsSurface: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ui.radius.card,
    backgroundColor: ui.surface.base,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  statValue: {
    ...typeScale.heading,
    color: palette.lilacDeep,
  },
  statLabel: {
    ...typeScale.caption,
    fontFamily: fonts.semibold,
    marginTop: 2,
    color: palette.inkSoft,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 42,
    backgroundColor: ui.surface.border,
  },
  pressed: {
    opacity: 0.68,
  },
});
