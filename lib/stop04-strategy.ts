export function isStop04PromotionNote(notes: string | null | undefined) {
  return Boolean(
    notes &&
      (notes.includes("Promotion: Stop 04 Public Market Scent Trail") ||
        notes.includes("Promotion: Scent Trail travel sets")),
  );
}
