import type { CreativeBrief, CreativeRequest } from "@/lib/creative-model";
import type { AssistantReply, LowStockInsight } from "@/lib/types";

export type TomedesToolLink = {
  label: string;
  url: string;
  description: string;
};

export const TOMEDES_SMART_LINKS = {
  promptGenerator: "https://www.tomedes.com/tools/ai-prompt-generator",
  contentWriter: "https://www.tomedes.com/tools/content-writer",
  textSummarizer: "https://www.tomedes.com/tools/text-summarizer",
} as const;

export function getTomedesCreativeLinks(): TomedesToolLink[] {
  return [
    {
      label: "SMART Prompt Generator",
      url: TOMEDES_SMART_LINKS.promptGenerator,
      description: "Refine the TARA image brief into a higher-confidence production prompt.",
    },
    {
      label: "SMART Content Writer",
      url: TOMEDES_SMART_LINKS.contentWriter,
      description: "Expand the campaign angle into captions, hooks, and concept notes.",
    },
  ];
}

export function getTomedesAssistantLinks(): TomedesToolLink[] {
  return [
    {
      label: "SMART Content Writer",
      url: TOMEDES_SMART_LINKS.contentWriter,
      description: "Turn the TARA store brief into a higher-confidence assistant answer.",
    },
    {
      label: "SMART Text Summarizer",
      url: TOMEDES_SMART_LINKS.textSummarizer,
      description: "Compress the store brief into a shorter WhatsApp, team, or shift summary.",
    },
  ];
}

export function buildTomedesCreativePromptPack(
  brief: CreativeBrief,
  request: CreativeRequest,
) {
  const imagePromptBrief = [
    "Create one improved production-ready image prompt using Tomedes SMART.",
    `Brand: TARA Extrait de Parfum.`,
    `Objective: refine an image-generation prompt for ${brief.scent.name}.`,
    `Format: ${request.format}. Channel: ${request.channel}. Aspect ratio: ${brief.strategy.aspectRatio}. Upscale: ${brief.strategy.upscaleLabel}.`,
    `Audience: ${brief.strategy.audience}`,
    `Nuance: ${brief.strategy.nuance}`,
    `Creative direction: ${brief.strategy.creativeDirection}`,
    `Prompt to improve: ${brief.imagePrompt}`,
    `Negative prompt to preserve: ${brief.negativePrompt}`,
    "Requirements:",
    "- Keep the TARA tone premium, minimal, elegant, and Malaysian-market relevant.",
    "- Keep the product identity exact and photoreal.",
    "- Preserve label readability and believable glass reflections.",
    "- Return one final improved image prompt only, then a short note explaining what SMART strengthened.",
  ].join("\n");

  const contentWriterBrief = [
    "Use Tomedes SMART Content Writer to turn this TARA campaign brief into polished launch copy.",
    `Product focus: ${brief.scent.name}`,
    `Campaign angle: ${brief.strategy.angle}`,
    `Audience: ${brief.strategy.audience}`,
    `Nuance: ${brief.strategy.nuance}`,
    `Direction: ${brief.strategy.creativeDirection}`,
    `Current caption draft: ${brief.caption}`,
    "Please return:",
    "1. One premium short caption",
    "2. One stronger conversion-first caption",
    "3. One short hook for story/reel cover text",
    "4. One concise CTA",
  ].join("\n");

  const workflowNotes = [
    "Paste the image brief into Tomedes SMART Prompt Generator with Image selected.",
    "Use the refined prompt in OpenAI, Midjourney, or your preferred renderer.",
    "Use the content-writer brief when you want Tomedes to tighten captions and campaign language.",
  ];

  return {
    imagePromptBrief,
    contentWriterBrief,
    workflowNotes,
    links: getTomedesCreativeLinks(),
  };
}

function formatRestockLines(restocks: LowStockInsight[]) {
  if (!restocks.length) {
    return "- No fragrances are currently below their reorder threshold.";
  }

  return restocks
    .map(
      (item) =>
        `- ${item.name}: ${item.stock} left on hand, floor level ${item.reorderLevel}, recommended restock +${item.recommendedRestock}.`,
    )
    .join("\n");
}

export function buildTomedesAssistantPromptPack(
  prompt: string,
  reply: AssistantReply["reply"],
  restocks: LowStockInsight[],
) {
  const chatBrief = [
    "Use Tomedes SMART Content Writer as a higher-confidence retail assistant for TARA POS.",
    "You are helping a premium Malaysian perfume brand interpret sales and inventory data.",
    `Staff question: ${prompt}`,
    "Current TARA in-app answer:",
    reply,
    "",
    "Known restock pressure:",
    formatRestockLines(restocks),
    "",
    "Please return:",
    "1. A cleaner assistant answer with a concise executive summary.",
    "2. A short action list for staff.",
    "3. A restock recommendation section if inventory pressure exists.",
    "4. Keep the tone premium, direct, and operationally useful.",
  ].join("\n");

  const summaryBrief = [
    "Use Tomedes SMART Text Summarizer to compress this TARA store brief into a fast shift handover summary.",
    "Target length: 4 bullet points maximum.",
    "Store brief to summarize:",
    reply,
    "",
    "Prioritized restocks:",
    formatRestockLines(restocks),
  ].join("\n");

  const workflowNotes = [
    "Use SMART Content Writer when you want a stronger sales answer or better phrasing.",
    "Use SMART Text Summarizer when you want the same answer compressed for handover, WhatsApp, or management notes.",
    "The TARA app still uses local store data as the source of truth before handoff.",
  ];

  return {
    chatBrief,
    summaryBrief,
    workflowNotes,
    links: getTomedesAssistantLinks(),
  };
}
