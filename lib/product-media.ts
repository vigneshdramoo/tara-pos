const productImageMap: Record<string, string> = {
  aurora: "/products/aurora.jpeg",
};

export function getProductImageUrl(slug: string) {
  return productImageMap[slug] ?? null;
}
