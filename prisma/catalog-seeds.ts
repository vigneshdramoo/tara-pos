export type CatalogProductSeed = {
  slug: string;
  sku: string;
  name: string;
  collection: string;
  description: string;
  notes: string;
  mood: string;
  sizeMl: number;
  priceCents: number;
  stock: number;
  reorderLevel: number;
  accentHex: string;
};

export const catalogProductSeeds: CatalogProductSeed[] = [
  {
    slug: "aureya",
    sku: "TARA-HER-50-AUREYA",
    name: "Aureya",
    collection: "For Her",
    description:
      "Born in the quiet glow of morning light, Aureya is softness that lingers. Delicate florals melt into creamy warmth and gentle musk, wrapping around the skin with a radiant elegance that stays close and memorable.",
    notes: "Floral, Soft Sweet, Powdery, Musky, Warm, Creamy, Elegant",
    mood: "Radiant, Soft, Elegant",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#E6A89A",
  },
  {
    slug: "zephyr",
    sku: "TARA-HIM-50-ZEPHYR",
    name: "Zephyr",
    collection: "For Him",
    description:
      "Born from the horizon where air meets silence, Zephyr is freedom without edges. Crisp bergamot and pineapple unfold into aromatic lavender and weightless woods, leaving a clean presence that feels infinite and quietly undeniable.",
    notes: "Fresh, Citrus, Aromatic, Woody, Musky, Airy, Clean",
    mood: "Fresh, Clean, Confident",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#6E8FB5",
  },
  {
    slug: "maris",
    sku: "TARA-SIG-50-MARIS",
    name: "Maris",
    collection: "Signature",
    description:
      "Inspired by the rhythm of the ocean and the warmth of skin, Maris is fresh yet intimate, clean yet addictive. Aquatic clarity meets soft woods and gentle musk to create a scent that stays close to the skin and even closer to memory.",
    notes: "Fresh, Aquatic, Musky, Woody, Clean, Soft Spicy, Skin-Like",
    mood: "Quiet, Intimate, Addictive",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#87957B",
  },
];
