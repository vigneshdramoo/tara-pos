import type { CheckoutPromotionId } from "@/lib/checkout-pricing";

export const STOP04_STRATEGY = {
  label: "TARA Scent Trail: Stop 04",
  eventWindow: "19-21 June 2026, 10AM-10PM",
  booth: "Booth 7, MRT Tunnel MyTOWNKL",
  activePromotionId: "PUBLIC_MARKET_STOP04" as CheckoutPromotionId,
  eventStart: new Date(Date.UTC(2026, 5, 19, 2, 0, 0, 0)),
  eventEnd: new Date(Date.UTC(2026, 5, 21, 14, 0, 0, 0)),
  checkpoints: [
    {
      id: "fri-close",
      label: "Friday 10PM",
      targetLabel: "25% to 30% sold",
      targetPercent: 30,
      dueAt: new Date(Date.UTC(2026, 5, 19, 14, 0, 0, 0)),
    },
    {
      id: "sat-midday",
      label: "Saturday 3PM",
      targetLabel: "45% sold",
      targetPercent: 45,
      dueAt: new Date(Date.UTC(2026, 5, 20, 7, 0, 0, 0)),
    },
    {
      id: "sat-close",
      label: "Saturday 10PM",
      targetLabel: "65% to 70% sold",
      targetPercent: 70,
      dueAt: new Date(Date.UTC(2026, 5, 20, 14, 0, 0, 0)),
    },
    {
      id: "sun-midday",
      label: "Sunday 3PM",
      targetLabel: "85% sold",
      targetPercent: 85,
      dueAt: new Date(Date.UTC(2026, 5, 21, 7, 0, 0, 0)),
    },
    {
      id: "sun-final",
      label: "Sunday 8PM",
      targetLabel: "Final allocation only",
      targetPercent: 100,
      dueAt: new Date(Date.UTC(2026, 5, 21, 12, 0, 0, 0)),
    },
  ],
} as const;

export function isStop04PromotionNote(notes: string | null | undefined) {
  return Boolean(notes?.includes("Promotion: Stop 04 Public Market Scent Trail"));
}

