import { CreativeStudio } from "@/components/creative/creative-studio";
import { PageIntro } from "@/components/page-intro";
import { buildCreativeBrief, normalizeCreativeRequest } from "@/lib/creative-model";

export const dynamic = "force-dynamic";

export default function CreativePage() {
  const initialRequest = normalizeCreativeRequest({
    scentSlug: "aurora",
    format: "product-image",
    channel: "instagram-feed",
    objective: "launch-drop",
    preset: "nocturne-vanity",
    aspectPreset: "instagram-portrait",
    upscaleMode: "enhanced",
  });
  const initialBrief = buildCreativeBrief(initialRequest);

  return (
    <>
      <PageIntro
        eyebrow="Creative studio"
        title="TARA content model"
        description="Upload a creative reference, fall back to the saved POS product photo when nothing is uploaded, choose the right aspect ratio and upscale level, and generate TARA-ready prompts that stay true to each scent and audience."
        actions={
          <div className="tara-button-primary rounded-[24px] px-5 py-4 text-sm font-medium">
            Reference first, product preserved, channel-ready output
          </div>
        }
      />

      <CreativeStudio initialBrief={initialBrief} initialRequest={initialRequest} />
    </>
  );
}
