import type { TaskDifficulty } from '@/components/tasks/taskTypes';

export type PlanPriority = 'high' | 'medium' | 'low';

export type Availability = {
  // Fechas locales YYYY-MM-DD elegidas por el usuario. Nunca se suponen.
  days: string[];
  minutesPerDay: number;
};

export type SubtaskField = 'title' | 'description' | 'durationMinutes' | 'difficulty' | 'scheduledDate';
export type ActivityField = 'title' | 'description' | 'difficulty' | 'deadline' | 'priority';

export type PlanSubtask = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: TaskDifficulty;
  dependsOn: string[];
  scheduledDate: string | null;
  order: number;
  // Campos corregidos a mano: prevalecen sobre cualquier respuesta posterior de la IA.
  editedFields: SubtaskField[];
};

export type PlanActivity = {
  id: string;
  title: string;
  description: string;
  // Solo existe si el usuario la mencionó; la IA no puede inferirla.
  deadline: string | null;
  priority: PlanPriority;
  prioritySource: 'user' | 'inferred';
  difficulty: TaskDifficulty;
  subtasks: PlanSubtask[];
  editedFields: ActivityField[];
};

export type PlanProposal = {
  id: string;
  summary: string;
  activities: PlanActivity[];
  revision: number;
};

export type PlanIssueKind =
  | 'unscheduled'
  | 'day_overload'
  | 'total_overload'
  | 'after_deadline'
  | 'dependency_order'
  | 'concentrated'
  | 'incomplete';

export type PlanIssue = {
  kind: PlanIssueKind;
  message: string;
  // Las bloqueantes impiden confirmar; el resto solo avisa.
  blocking: boolean;
};
