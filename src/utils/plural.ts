/** Concuerda un sustantivo con su cantidad: plural(1, 'tarea') → «1 tarea». */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
