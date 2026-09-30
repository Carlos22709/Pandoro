import { ScreenPlaceholder } from '@/components/screens/ScreenPlaceholder';

export default function NewTaskRoute() {
  return (
    <ScreenPlaceholder
      title="Nueva tarea"
      subtitle="Esta pantalla aún no existe. Mientras tanto, crea la tarea con el + de Tareas."
      symbol="plus"
      secondary
    />
  );
}
