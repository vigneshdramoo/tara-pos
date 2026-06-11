export const MALAYSIA_TIME_ZONE = "Asia/Kuala_Lumpur";

const malaysiaDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MALAYSIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const malaysiaTimePartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: MALAYSIA_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const malaysiaWeekdayFormatter = new Intl.DateTimeFormat("en-MY", {
  timeZone: MALAYSIA_TIME_ZONE,
  weekday: "short",
});

function getPartsMap(formatter: Intl.DateTimeFormat, value: string | Date) {
  return formatter
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = part.value;
      }

      return parts;
    }, {});
}

export function getMalaysiaDateParts(value: string | Date = new Date()) {
  const parts = getPartsMap(malaysiaDatePartsFormatter, value);

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

export function getMalaysiaTimeParts(value: string | Date = new Date()) {
  const parts = getPartsMap(malaysiaTimePartsFormatter, value);

  return {
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function getMalaysiaDateKey(value: string | Date = new Date()) {
  const { year, month, day } = getMalaysiaDateParts(value);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMalaysiaDayStart(value: string | Date = new Date()) {
  const { year, month, day } = getMalaysiaDateParts(value);

  return new Date(Date.UTC(year, month - 1, day, -8, 0, 0, 0));
}

export function addUtcDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

export function getMalaysiaWeekdayLabel(value: string | Date) {
  return malaysiaWeekdayFormatter.format(new Date(value));
}

export function getMalaysiaTimestamp(value: string | Date = new Date()) {
  const { year, month, day } = getMalaysiaDateParts(value);
  const { hour, minute, second } = getMalaysiaTimeParts(value);

  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${hour}${minute}${second}`;
}
