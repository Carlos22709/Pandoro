// Adaptador real: expo-notifications en Android e iOS; en la web no hay avisos programados.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ANDROID_CHANNEL_ID, createReminderService, type NotificationsAdapter } from '@/services/reminders/reminderService';

function createAdapter(): NotificationsAdapter | null {
  if (Platform.OS === 'web') return null;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recordatorios de tareas',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).catch(() => undefined);
  }
  return {
    getPermissionsAsync: Notifications.getPermissionsAsync,
    requestPermissionsAsync: () => Notifications.requestPermissionsAsync(),
    scheduleNotificationAsync: ({ identifier, content, trigger }) => Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
        channelId: trigger.channelId,
      },
    }),
    cancelScheduledNotificationAsync: Notifications.cancelScheduledNotificationAsync,
    getAllScheduledNotificationsAsync: Notifications.getAllScheduledNotificationsAsync,
  };
}

export const reminderService = createReminderService(createAdapter());
export const remindersSupported = Platform.OS !== 'web';
