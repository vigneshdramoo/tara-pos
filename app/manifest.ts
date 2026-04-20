import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TARA Atelier POS",
    short_name: "TARA POS",
    description:
      "A local-first iPad point-of-sale app for the TARA perfume boutique.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#f6efe7",
    theme_color: "#f6efe7",
    icons: [
      {
        src: "/icons/tara-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/tara-mark-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
