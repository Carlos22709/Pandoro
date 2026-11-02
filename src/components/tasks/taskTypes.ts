import type { AppIconName } from '@/components/icons/AppIcon';
import type { PaletteTone } from '@/theme/palette';

export type TaskDifficulty = 'light' | 'medium' | 'high';

export const TASK_DIFFICULTY: Record<
  TaskDifficulty,
  { label: string; tone: PaletteTone; weight: number }
> = {
  light: { label: 'Fácil', tone: 'green', weight: 1 },
  medium: { label: 'Media', tone: 'yellow', weight: 2 },
  high: { label: 'Difícil', tone: 'pink', weight: 3 },
};

export type TaskItem = {
  id: string;
  title: string;
  detail: string;
  duration?: string;
  notes?: string;
  priority: number;
  tone: PaletteTone;
  icon: AppIconName;
  difficulty: TaskDifficulty;
  completed: boolean;
};

export type TaskDraft = Pick<TaskItem, 'title' | 'detail' | 'duration' | 'difficulty'>;
