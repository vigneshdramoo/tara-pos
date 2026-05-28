const ALL_SCENTS_REFERENCE_VERSION = "20260503";

const productImageMap: Record<string, string> = {
  aureya: "/products/aureya-50ml.jpg",
  "aureya-10ml": "/products/aureya-8ml.png",
  zephyr: "/products/zephyr-50ml.jpg",
  "zephyr-10ml": "/products/zephyr-8ml.png",
  maris: "/products/maris-50ml.jpg",
  "maris-10ml": "/products/maris-8ml.png",
  eliora: "/products/eliora-50ml.jpg",
  "eliora-10ml": "/products/eliora-8ml.png",
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
