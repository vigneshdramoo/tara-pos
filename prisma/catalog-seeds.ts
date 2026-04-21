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

export const legacyDemoProductSlugs = [
  "midnight-saffron",
  "neroli-veil",
  "cedar-silk",
  "rose-ash",
  "fig-nocturne",
  "salted-jasmine",
  "velvet-amber",
  "white-oud-linen",
] as const;

export const catalogProductSeeds: CatalogProductSeed[] = [
  {
    slug: "aurora",
    sku: "TARA-HERA-50-AURORA",
    name: "Aurora",
    collection: "Hera",
    description:
      "A luminous floral-musky composition that opens with a delicate glow of pear and soft freshness, unfolding into a graceful heart of jasmine, rose, and neroli before settling into clean white musk and amber warmth.",
    notes: "Pear, Jasmine, Rose, Neroli, White Musk, Amber, Tonka",
    mood: "Radiant, Intimate, Unforgettable",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#CA9E5B",
  },
  {
    slug: "zephyr",
    sku: "TARA-ZEUS-50-ZEPHYR",
    name: "Zephyr",
    collection: "Zeus",
    description:
      "A bright aromatic-woody composition with crisp freshness and luminous citrus, sharpened by a subtle fruited lift before it settles into smooth woods, aromatic facets, and a polished clean trail.",
    notes: "Citrus Freshness, Pineapple Accent, Aromatic Woods, Lavender Nuance, Clean Musk, Amberwood",
    mood: "Airy, Confident, Effortless",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#1A334A",
  },
  {
    slug: "ardor",
    sku: "TARA-ZEUS-50-ARDOR",
    name: "Ardor",
    collection: "Zeus",
    description:
      "A warm spicy-amber composition built around heat, contrast, and tension, opening with vivid spice and dark sweetness before settling into an intense trail of ambered woods and sensual warmth.",
    notes: "Hot Spice, Dark Sweetness, Aromatic Heart, Amber, Woods, Tonka Warmth",
    mood: "Smouldering, Bold, Addictive",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#C88E4D",
  },
  {
    slug: "siren",
    sku: "TARA-HERA-50-SIREN",
    name: "Siren",
    collection: "Hera",
    description:
      "A dark floral-amber composition with seductive depth and elegant tension, revealing velvety florals, creamy facets, and a sensual base that feels opulent, mysterious, and distinctly feminine.",
    notes: "Dark Florals, Creamy White Flowers, Velvet Amber, Soft Spice, Patchouli Shadow, Warm Musk",
    mood: "Magnetic, Luxurious, Dangerous",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#4B306A",
  },
  {
    slug: "ember",
    sku: "TARA-HERA-50-EMBER",
    name: "Ember",
    collection: "Hera",
    description:
      "A luminous gourmand-floral composition that opens with sweetness and sparkle, softens into a lush floral heart, and settles into a warm, enveloping trail that feels romantic, familiar, and deeply inviting.",
    notes: "Sweet Bloom, Floral Warmth, Soft Fruit Glow, Vanilla Haze, Amber, Gentle Musk",
    mood: "Warm, Sensual, Comforting",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#C88E4D",
  },
  {
    slug: "sol",
    sku: "TARA-ZEUS-50-SOL",
    name: "Sol",
    collection: "Zeus",
    description:
      "A smooth woody-spiced composition with subtle sensuality and controlled depth, opening with softened spice and aromatic warmth before unfolding into polished woods and a close, inviting base.",
    notes: "Cardamom Glow, Aromatic Warmth, Polished Woods, Soft Spice, Tonka Hush, Musk",
    mood: "Warm, Intimate, Refined",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#CA9E5B",
  },
  {
    slug: "nova",
    sku: "TARA-HERA-50-NOVA",
    name: "Nova",
    collection: "Hera",
    description:
      "A refined floral-aldehydic composition with brightness, elegance, and a polished feminine aura, opening with luminous freshness before resting on a soft, graceful trail that feels classic yet modern.",
    notes: "Luminous Florals, Aldehydic Sparkle, Jasmine Glow, Soft Rose, Powdered Grace, Clean Musk",
    mood: "Radiant, Poised, Distinctive",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#CA9E5B",
  },
  {
    slug: "zenith",
    sku: "TARA-ZEUS-50-ZENITH",
    name: "Zenith",
    collection: "Zeus",
    description:
      "A fresh woody-amber composition with sharp clarity and modern force, opening with crisp brightness and energetic lift before settling into a dry, radiating base that feels assertive, polished, and unmistakably present.",
    notes: "Crisp Freshness, Bright Citrus Lift, Aromatic Edge, Dry Woods, Amber, Radiant Musk",
    mood: "Powerful, Clean, Commanding",
    sizeMl: 50,
    priceCents: 15900,
    stock: 50,
    reorderLevel: 12,
    accentHex: "#0A0A0A",
  },
];
