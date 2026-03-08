import { DAY_KEYS, type DayKey, type OpeningHours } from "@/lib/types";
import { DAY_LABELS } from "@/lib/place-data";
import { Input } from "@/components/ui/input";

type OpeningHoursEditorProps = {
  hours: OpeningHours;
  onChange: (hours: OpeningHours) => void;
};

export function OpeningHoursEditor({
  hours,
  onChange,
}: OpeningHoursEditorProps) {
  function updateDay(day: DayKey, nextValue: Partial<OpeningHours[DayKey]>) {
    onChange({
      ...hours,
      [day]: {
        ...hours[day],
        ...nextValue,
      },
    });
  }

  return (
    <div className="space-y-2">
      {DAY_KEYS.map((day) => (
        <div
          key={day}
          className="grid grid-cols-[3.25rem_1fr_1fr] items-center gap-2"
        >
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={hours[day].enabled}
              onChange={(event) =>
                updateDay(day, { enabled: event.target.checked })
              }
              className="size-4 rounded border-border text-primary focus:ring-ring"
            />
            {DAY_LABELS[day]}
          </label>
          <Input
            type="time"
            value={hours[day].open}
            disabled={!hours[day].enabled}
            onChange={(event) => updateDay(day, { open: event.target.value })}
          />
          <Input
            type="time"
            value={hours[day].close}
            disabled={!hours[day].enabled}
            onChange={(event) => updateDay(day, { close: event.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
