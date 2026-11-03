import { Platform } from "react-native";

/**
 * Content Safety Moderation Filter
 * Enforces compliance with App Store Review Guideline 1.1 (Safety - Objectionable Content).
 * Rejects prompts and filters out templates that attempt to generate intimate physical contact
 * (such as kissing, hugging, or romantic embraces) or any sexually suggestive / objectionable content.
 */

export const OBJECTIONABLE_REGEX =
  /\b(kiss|kissing|kisses|smooch|smooching|make\s*out|making\s*out|hug|hugs|hugging|embrace|embracing|embraces|fondle|fondling|intimate|intimacy|intimate\s*contact|sexual|erotic|nude|nudity|naked|nsfw|sensual|groping|caress|caressing|cuddle|cuddling|touching\s*lips|intertwined|lovers|romantic\s*couple)\b/i;

export const OBJECTIONABLE_SLUGS = new Set([
  "vampire-royal-ball",
  "vampire-witch-toast",
  "haunted-elevator-ride",
  "flying-broomstick-witch",
  "skeleton-hands-makeover",
  "head-lean",
  "bouquet-toss",
  "classic-wedding",
  "first-dance",
  "last-dance",
  "romantic-couple",
]);

/**
 * Checks whether a template preset is objectionable or contains intimate physical contact.
 */
export function isObjectionableTemplate(preset: any): boolean {
  if (!preset) return false;
  if (preset.hideFromIos === true || preset.hidefromios === true) return true;

  const slug = String(preset.slug || preset.id || "").toLowerCase();
  if (OBJECTIONABLE_SLUGS.has(slug)) return true;

  const category = String(preset.category || preset.categoryId || "").toLowerCase();
  if (
    category.includes("wedding") ||
    category.includes("couples") ||
    category.includes("romance")
  ) {
    return true;
  }

  const name = String(preset.name || "");
  const prompt = String(preset.prompt || "");
  const text = `${name} ${slug} ${category} ${prompt}`;
  return OBJECTIONABLE_REGEX.test(text);
}

/**
 * Filters a list of templates for the target platform (filters out intimate/objectionable templates on iOS).
 */
export function filterTemplatesForPlatform(
  templates: any[],
  platform: string = Platform.OS
): any[] {
  if (!Array.isArray(templates)) return [];
  if (platform !== "ios") return templates;
  return templates.filter((item) => !isObjectionableTemplate(item));
}

/**
 * Validates a prompt string against Guideline 1.1 safety criteria.
 */
export function validatePromptSafety(prompt?: string | null): {
  isSafe: boolean;
  reason?: string;
} {
  if (!prompt || typeof prompt !== "string") {
    return { isSafe: true };
  }

  const match = prompt.match(OBJECTIONABLE_REGEX);
  if (match) {
    return {
      isSafe: false,
      reason: `Prompts requesting intimate physical contact or objectionable content (e.g. "${match[0]}") are not permitted to ensure user safety and compliance with App Store Guideline 1.1.`,
    };
  }

  return { isSafe: true };
}
