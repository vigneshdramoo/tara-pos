const moneyFormatter = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-MY", {
  weekday: "short",
});

export function formatCurrency(cents: number) {
  return moneyFormatter.format(cents / 100);
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("en-MY").format(value);
}

export function formatCompactDate(value: string | Date) {
  return shortDateFormatter.format(new Date(value));
}

export function formatFullDateTime(value: string | Date) {
  return fullDateFormatter.format(new Date(value));
}

export function formatWeekday(value: string | Date) {
  return weekdayFormatter.format(new Date(value));
}
