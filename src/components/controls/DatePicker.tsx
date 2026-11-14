import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parseIsoDate, toIsoDate } from '@/services/planning/planDates';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
// La semana empieza en lunes, igual que en el cierre de semana.
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type DatePickerProps = {
  // Fecha elegida (ISO local) o null si la tarea no tiene fecha.
  value: string | null;
  onChange: (value: string | null) => void;
  // Día que se marca como «hoy»; viene de fuera para no leer el reloj aquí.
  today: Date;
};

// Calendario del mes: la fecha se elige tocando un día, nunca se escribe a mano.
export function DatePicker({ value, onChange, today }: DatePickerProps) {
  const selected = value ? parseIsoDate(value) : null;
  const anchor = selected ?? today;
  const [month, setMonth] = useState({ year: anchor.getFullYear(), month: anchor.getMonth() });
  const todayIso = toIsoDate(today);

  const cells = useMemo(() => {
    const first = new Date(month.year, month.month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1;
      return day >= 1 && day <= daysInMonth ? toIsoDate(new Date(month.year, month.month, day)) : null;
    });
  }, [month]);

  const shift = (delta: number) => {
    const next = new Date(month.year, month.month + delta, 1);
    setMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          hitSlop={8}
          onPress={() => shift(-1)}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.monthName} accessibilityLiveRegion="polite">
          {MONTHS[month.month]} {month.year}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          hitSlop={8}
          onPress={() => shift(1)}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((name) => (
          <Text key={name} style={styles.weekday}>{name}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, index) => {
          if (!iso) return <View key={'empty-' + index} style={styles.cell} />;
          const isSelected = iso === value;
          const day = Number(iso.slice(8));
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              aria-selected={isSelected}
              accessibilityLabel={`${day} de ${MONTHS[month.month]}${iso === todayIso ? ', hoy' : ''}`}
              onPress={() => onChange(iso)}
              style={({ pressed }) => [
                styles.cell,
                styles.day,
                iso === todayIso && styles.dayToday,
                isSelected && styles.daySelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(null)}
        style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
      >
        <Text style={styles.clearText}>Sin fecha</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 8,
    padding: 10,
    borderRadius: ui.radius.card,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: ui.surface.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: ui.size.touch, height: ui.size.touch, alignItems: 'center', justifyContent: 'center' },
  arrowText: { ...typeScale.heading, color: palette.lilacDeep },
  monthName: { ...typeScale.body, fontFamily: fonts.bold, color: palette.ink, textTransform: 'capitalize' },
  week: { flexDirection: 'row', marginTop: 2 },
  weekday: { flex: 1, textAlign: 'center', ...typeScale.caption, fontFamily: fonts.bold, color: palette.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' },
  day: { borderRadius: ui.radius.round },
  dayToday: { borderWidth: 1, borderColor: palette.lilac },
  daySelected: { backgroundColor: palette.lilacDeep, borderColor: palette.lilacDeep },
  dayText: { ...typeScale.small, fontFamily: fonts.semibold, color: palette.ink },
  dayTextSelected: { color: palette.white },
  clear: { alignSelf: 'center', minHeight: ui.size.touch, justifyContent: 'center', paddingHorizontal: 12 },
  clearText: { ...typeScale.small, fontFamily: fonts.bold, color: palette.lilacDeep },
  pressed: { opacity: 0.7 },
});
