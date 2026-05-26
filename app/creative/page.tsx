import { CreativeStudio } from "@/components/creative/creative-studio";
import { PageIntro } from "@/components/page-intro";
import { buildCreativeBrief, normalizeCreativeRequest } from "@/lib/creative-model";

export const dynamic = "force-dynamic";

export default function CreativePage() {
  const initialRequest = normalizeCreativeRequest({
    scentSlug: "maris",
    workflow: "hybrid-precision",
    format: "story-reel",
    channel: "instagram-story",
    objective: "launch-drop",
    preset: "after-rain-silence",
    aspectPreset: "instagram-story",
    upscaleMode: "enhanced",
  });
  const initialBrief = buildCreativeBrief(initialRequest);

  return (
    <>
      <PageIntro
        eyebrow="Creative studio"
        title="TARA content model"
        description="Build fresh emotional storytelling fragrance visuals from saved POS bottle references, optional mood uploads, 10 campaign prompt modes, aspect presets, and upscale-aware prompt packs for direct rendering, Midjourney precision handoff, or Tomedes SMART refinement."
        actions={
          <div className="tara-button-primary rounded-[24px] px-5 py-4 text-sm font-medium">
            10 emotional prompt modes, fresh-request variation, product-safe output
          </div>
        }
      />

      <CreativeStudio initialBrief={initialBrief} initialRequest={initialRequest} />
    </>
  );
}
