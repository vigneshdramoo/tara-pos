const PRODUCT_REFERENCE_VERSION = "20260503";

const productImageMap: Record<string, string> = {
  aureya: `/products/aureya.png?v=${PRODUCT_REFERENCE_VERSION}`,
  zephyr: `/products/zephyr.png?v=${PRODUCT_REFERENCE_VERSION}`,
  maris: `/products/maris.png?v=${PRODUCT_REFERENCE_VERSION}`,
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
