import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dayNumber, upcomingDays, weekdayShort } from '@/services/planning/planDates';
import { palette } from '@/theme/palette';
import { fonts, typeScale } from '@/theme/typography';
import { ui } from '@/theme/ui';

const DAYS_SHOWN = 21;

type AvailabilityPickerProps = {
  days: string[];
  minutesPerDay: string;
  onChangeDays: (days: string[]) => void;
  onChangeMinutes: (minutes: string) => void;
};

// Nada viene marcado: la disponibilidad la declara el usuario, no se supone.
export function AvailabilityPicker({ days, minutesPerDay, onChangeDays, onChangeMinutes }: AvailabilityPickerProps) {
  const calendar = useMemo(() => upcomingDays(new Date(), DAYS_SHOWN), []);

  const toggleDay = (day: string) => {
    onChangeDays(days.includes(day) ? days.filter((item) => item !== day) : [...days, day].sort());
  };

  return (
    <View>
      <Text style={styles.label}>¿Qué días puedes trabajar?</Text>
      <View style={styles.grid}>
        {calendar.map((day) => {
          const selected = days.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              aria-checked={selected}
              accessibilityLabel={`${weekdayShort(day)} ${dayNumber(day)}`}
              onPress={() => toggleDay(day)}
              style={({ pressed }) => [styles.day, selected && styles.daySelected, pressed && styles.pressed]}
            >
              <Text style={[styles.dayName, selected && styles.dayTextSelected]}>{weekdayShort(day)}</Text>
              <Text style={[styles.dayNumber, selected && styles.dayTextSelected]}>{dayNumber(day)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, styles.minutesLabel]}>¿Cuántos minutos por día?</Text>
      <TextInput
        value={minutesPerDay}
        onChangeText={(value) => onChangeMinutes(value.replace(/\D/g, ''))}
        keyboardType="number-pad"
        placeholder="120"
        placeholderTextColor={palette.inkSoft}
        accessibilityLabel="Minutos disponibles por día"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typeScale.caption, fontFamily: fonts.bold, color: palette.inkSoft, marginLeft: 4, marginBottom: 6 },
  minutesLabel: { marginTop: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: {
    width: '13%',
    minWidth: 40,
    flexGrow: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ui.radius.small,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(117, 101, 127, 0.12)',
  },
  daySelected: { backgroundColor: palette.lilacSoft, borderColor: palette.lilac },
  dayName: { ...typeScale.caption, fontFamily: fonts.semibold, color: palette.inkSoft },
  dayNumber: { ...typeScale.small, fontFamily: fonts.bold, color: palette.ink },
  dayTextSelected: { color: palette.lilacDeep },
  input: {
    minHeight: 48,
    borderRadius: ui.radius.control,
    paddingHorizontal: 15,
    color: palette.ink,
    fontFamily: fonts.semibold,
    fontSize: typeScale.body.fontSize,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(148, 123, 179, 0.2)',
  },
  pressed: { opacity: 0.72 },
});
