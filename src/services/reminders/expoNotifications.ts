// Web: sin avisos programados. No se importa expo-notifications para no registrar
// escuchas de push token que la web no soporta (avisa en consola en cada carga).
import { createReminderService } from '@/services/reminders/reminderService';

export const reminderService = createReminderService(null);
export const remindersSupported = false;
