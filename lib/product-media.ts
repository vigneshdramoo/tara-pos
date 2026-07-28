const ALL_SCENTS_REFERENCE_VERSION = "20260503";

const productImageMap: Record<string, string> = {
  ardor: "/products/ardor-product-20260705.jpg",
  "ardor-10ml": "/products/ardor-product-20260705.jpg",
  ashoka: "/products/ashoka-product-20260705.jpg",
  "ashoka-10ml": "/products/ashoka-product-20260705.jpg",
  eliora: "/products/eliora-product-20260705.jpg",
  "eliora-10ml": "/products/eliora-product-20260705.jpg",
  aureya: "/products/aureya-product-20260705.jpg",
  "aureya-10ml": "/products/aureya-product-20260705.jpg",
  maris: "/products/maris-product-20260705.jpg",
  "maris-10ml": "/products/maris-product-20260705.jpg",
  zephyr: "/products/zephyr-product-20260705.jpg",
  "zephyr-10ml": "/products/zephyr-product-20260705.jpg",
  theon: "/products/theon-product-20260729.png",
  "theon-10ml": "/products/theon-product-20260729.png",
};

const allScentsReferenceUrls = [
  productImageMap.aureya,
  productImageMap.zephyr,
  productImageMap.maris,
  productImageMap.eliora,
  productImageMap.ashoka,
  productImageMap.ardor,
  productImageMap.theon,
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
