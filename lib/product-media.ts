const PRODUCT_REFERENCE_VERSION = "20260503";
const ALL_SCENTS_REFERENCE_VERSION = "20260503";

const productImageMap: Record<string, string> = {
  aureya: `/products/aureya-reference-${PRODUCT_REFERENCE_VERSION}.png`,
  "aureya-10ml": `/products/aureya-reference-${PRODUCT_REFERENCE_VERSION}.png`,
  zephyr: "/products/zephyr-reference-20260503-2.jpg",
  "zephyr-10ml": "/products/zephyr-reference-20260503-2.jpg",
  maris: `/products/maris-reference-${PRODUCT_REFERENCE_VERSION}.png`,
  "maris-10ml": `/products/maris-reference-${PRODUCT_REFERENCE_VERSION}.png`,
  eliora: "/products/eliora-reference-20260514.png",
  "eliora-10ml": "/products/eliora-reference-20260514.png",
};

const allScentsReferenceUrls = [
  productImageMap.aureya,
  productImageMap.zephyr,
  productImageMap.maris,
  productImageMap.eliora,
  `/products/all-scents-reference-${ALL_SCENTS_REFERENCE_VERSION}-2.png`,
];

export function getProductImageUrl(slug: string) {
  return productImageMap[slug] ?? null;
}

export function getProductImageUrls(slug: string) {
  const imageUrl = getProductImageUrl(slug);

  return imageUrl ? [imageUrl] : [];
}

export function getAllProductImageUrls() {
  return allScentsReferenceUrls;
}
