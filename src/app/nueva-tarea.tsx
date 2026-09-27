import { ScreenPlaceholder } from '@/components/screens/ScreenPlaceholder';

export default function NewTaskRoute() {
  return (
    <ScreenPlaceholder
      title="Nueva tarea"
      subtitle="Este espacio está listo para crear tu próxima tarea."
      tone="pink"
      symbol="plus"
      secondary
    />
  );
}
