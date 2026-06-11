export type StockTone = "healthy" | "low" | "critical" | "soldOut";

export type StockStatus = {
  tone: StockTone;
  label: string;
  detail: string;
  progress: number;
};

export function getStockStatus(stock: number, reorderLevel: number): StockStatus {
  const target = Math.max(reorderLevel * 2, 12);
  const progress = stock <= 0 ? 0 : Math.min(100, Math.round((stock / target) * 100));
  const criticalThreshold = Math.max(1, Math.floor(reorderLevel / 2));

  if (stock <= 0) {
    return {
      tone: "soldOut",
      label: "Sold out",
      detail: "0 left",
      progress,
    };
  }

  if (stock <= criticalThreshold) {
    return {
      tone: "critical",
      label: "Critical",
      detail: `${stock} left`,
      progress,
    };
  }

  if (stock <= reorderLevel) {
    return {
      tone: "low",
      label: "Low",
      detail: `${stock} left`,
      progress,
    };
  }

  return {
    tone: "healthy",
    label: "Healthy",
    detail: `${stock} left`,
    progress,
  };
}
