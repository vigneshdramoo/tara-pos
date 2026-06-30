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
    priceCents: 16900,
    stock: 20,
    reorderLevel: 12,
    accentHex: "#F6C6D0",
  },
  {
    slug: "aureya-10ml",
    sku: "TARA-HER-8-AUREYA",
    name: "Aureya 8mL",
    collection: "For Her",
    description:
      "A travel-size Aureya for first impressions, gifting, and pop-up discovery. Delicate florals melt into creamy warmth and gentle musk, keeping its radiant elegance close to skin.",
    notes: "Floral, Soft Sweet, Powdery, Musky, Warm, Creamy, Elegant",
    mood: "Radiant, Soft, Elegant",
    sizeMl: 8,
    priceCents: 4500,
    stock: 50,
    reorderLevel: 15,
    accentHex: "#F6C6D0",
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
    priceCents: 16900,
    stock: 20,
    reorderLevel: 12,
    accentHex: "#DFF4FF",
  },
  {
    slug: "zephyr-10ml",
    sku: "TARA-HIM-8-ZEPHYR",
    name: "Zephyr 8mL",
    collection: "For Him",
    description:
      "A travel-size Zephyr for trial, travel, and quick gifting. Crisp bergamot and pineapple move into aromatic lavender and weightless woods for a clean, confident trail.",
    notes: "Fresh, Citrus, Aromatic, Woody, Musky, Airy, Clean",
    mood: "Fresh, Clean, Confident",
    sizeMl: 8,
    priceCents: 4500,
    stock: 50,
    reorderLevel: 15,
    accentHex: "#DFF4FF",
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
    priceCents: 16900,
    stock: 20,
    reorderLevel: 12,
    accentHex: "#2F5F5B",
  },
  {
    slug: "maris-10ml",
    sku: "TARA-SIG-8-MARIS",
    name: "Maris 8mL",
    collection: "Signature",
    description:
      "A travel-size Maris for discovery and close-range wear. Aquatic clarity meets soft woods and gentle musk, fresh yet intimate with a skin-like finish.",
    notes: "Fresh, Aquatic, Musky, Woody, Clean, Soft Spicy, Skin-Like",
    mood: "Quiet, Intimate, Addictive",
    sizeMl: 8,
    priceCents: 4500,
    stock: 50,
    reorderLevel: 15,
    accentHex: "#2F5F5B",
  },
  {
    slug: "eliora",
    sku: "TARA-HER-50-ELIORA",
    name: "Eliora",
    collection: "For Her",
    description:
      "ELIORA is a golden floral-musk made for the hour when daylight becomes secretive. A sparkling citrus-spice opening gives way to creamy white florals before clean musk, amber skin, and sheer woods settle close.",
    notes: "Golden Floral, Soft Spice, Creamy White Florals, Clean Musk, Amber, Sheer Woods",
    mood: "Mysterious, Radiant, Intimate",
    sizeMl: 50,
    priceCents: 16900,
    stock: 20,
    reorderLevel: 12,
    accentHex: "#D5A356",
  },
  {
    slug: "eliora-10ml",
    sku: "TARA-HER-8-ELIORA",
    name: "Eliora 8mL",
    collection: "For Her",
    description:
      "A travel-size Eliora for the pop-up discovery ritual. Golden floral brightness opens into soft spice, clean musk, amber skin, and sheer woods.",
    notes: "Golden Floral, Soft Spice, Creamy White Florals, Clean Musk, Amber, Sheer Woods",
    mood: "Mysterious, Radiant, Intimate",
    sizeMl: 8,
    priceCents: 4500,
    stock: 50,
    reorderLevel: 15,
    accentHex: "#D5A356",
  },
  {
    slug: "ashoka",
    sku: "TARA-SIG-50-ASHOKA",
    name: "Ashoka",
    collection: "Signature",
    description:
      "ASHOKA is a poised floral-amber signature with a golden lift and a soft, meditative trail. Warm petals, polished woods, and quiet musk settle into a scent that feels composed, graceful, and enduring.",
    notes: "Golden Florals, Soft Amber, Polished Woods, Warm Musk, Elegant",
    mood: "Composed, Golden, Graceful",
    sizeMl: 50,
    priceCents: 16900,
    stock: 20,
    reorderLevel: 12,
    accentHex: "#CA9E5B",
  },
  {
    slug: "ashoka-10ml",
    sku: "TARA-SIG-8-ASHOKA",
    name: "Ashoka 8mL",
    collection: "Signature",
    description:
      "A travel-size Ashoka for discovery, gifting, and close daily wear. Golden florals, soft amber, polished woods, and warm musk create a graceful signature in a portable ritual.",
    notes: "Golden Florals, Soft Amber, Polished Woods, Warm Musk, Elegant",
    mood: "Composed, Golden, Graceful",
    sizeMl: 8,
    priceCents: 4500,
    stock: 50,
    reorderLevel: 15,
    accentHex: "#CA9E5B",
  },
  {
    slug: "ardor",
    sku: "TARA-SIG-50-ARDOR",
    name: "Ardor",
    collection: "Signature",
    description:
      "ARDOR is a warm amber-wood fragrance with a restrained sense of intensity. Smooth spice, resinous warmth, woods, and skin musk create a confident trail that feels magnetic without becoming loud.",
    notes: "Warm Amber, Smooth Spice, Resinous Woods, Skin Musk, Magnetic",
    mood: "Warm, Magnetic, Intense",
    sizeMl: 50,
    priceCents: 16900,
    stock: 20,
    reorderLevel: 12,
    accentHex: "#4B306A",
  },
  {
    slug: "ardor-10ml",
    sku: "TARA-SIG-8-ARDOR",
    name: "Ardor 8mL",
    collection: "Signature",
    description:
      "A travel-size Ardor for evening discovery, layering, and confident close-range wear. Smooth spice, amber warmth, resinous woods, and skin musk leave a magnetic finish.",
    notes: "Warm Amber, Smooth Spice, Resinous Woods, Skin Musk, Magnetic",
    mood: "Warm, Magnetic, Intense",
    sizeMl: 8,
    priceCents: 4500,
    stock: 50,
    reorderLevel: 15,
    accentHex: "#4B306A",
  },
];
