const productImageMap: Record<string, string> = {
  aureya: "/products/aureya.png",
  zephyr: "/products/zephyr.png",
  maris: "/products/maris.png",
};

export function getProductImageUrl(slug: string) {
  return productImageMap[slug] ?? null;
}

export function getProductImageUrls(slug: string) {
  const imageUrl = getProductImageUrl(slug);

  return imageUrl ? [imageUrl] : [];
}

export function getAllProductImageUrls() {
  return Object.values(productImageMap);
}
