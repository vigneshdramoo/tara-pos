const PRODUCT_REFERENCE_VERSION = "20260503";

const productImageMap: Record<string, string> = {
  aureya: `/products/aureya-reference-${PRODUCT_REFERENCE_VERSION}.png`,
  zephyr: `/products/zephyr-reference-${PRODUCT_REFERENCE_VERSION}.png`,
  maris: `/products/maris-reference-${PRODUCT_REFERENCE_VERSION}.png`,
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
