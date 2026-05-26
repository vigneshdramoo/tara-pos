export const scentMatchOptions = [
  { value: "aureya", label: "Aureya", detail: "Radiant, warm, soft power." },
  { value: "zephyr", label: "Zephyr", detail: "Clean, composed, controlled presence." },
  { value: "maris", label: "Maris", detail: "Mineral, intimate, skin-close calm." },
  { value: "discovery-pack", label: "Discovery Pack", detail: "Still deciding; wants to compare." },
] as const;

export const ageRangeOptions = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
] as const;

export const purchaseIntentOptions = [
  { value: "BUY_TODAY", label: "Buy today" },
  { value: "BUY_LATER", label: "Buy later" },
  { value: "DISCOVERY_PACK", label: "Discovery Pack interest" },
  { value: "JUST_EXPLORING", label: "Just exploring" },
  { value: "GIFTING", label: "Gifting" },
] as const;

export const leadSourceOptions = [
  { value: "POPUP_BOOTH", label: "Popup booth" },
  { value: "QUIZ", label: "Quiz" },
  { value: "WEBSITE", label: "Website" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OTHER", label: "Other" },
] as const;

export function getScentMatchLabel(value: string | null | undefined) {
  return scentMatchOptions.find((option) => option.value === value)?.label ?? "Unknown";
}

export function getPurchaseIntentLabel(value: string | null | undefined) {
  return purchaseIntentOptions.find((option) => option.value === value)?.label ?? "Unknown";
}

export function getLeadSourceLabel(value: string | null | undefined) {
  return leadSourceOptions.find((option) => option.value === value)?.label ?? "Unknown";
}
