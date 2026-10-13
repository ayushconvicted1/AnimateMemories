/**
 * Content Safety Moderation Filter
 * Enforces compliance with App Store Review Guideline 1.1 (Safety - Objectionable Content).
 * Rejects prompts that attempt to generate intimate physical contact (kissing, hugging, romantic embraces)
 * or any sexually suggestive / objectionable content.
 */

const OBJECTIONABLE_REGEX =
  /\b(kiss|kissing|kisses|smooch|smooching|make\s*out|making\s*out|hug|hugging|hugs|embrace|embracing|fondle|fondling|intimate\s*contact|sexual|erotic|nude|nudity|naked|nsfw|sensual|groping)\b/i;

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
      reason: `Prompts requesting intimate contact or objectionable content (e.g. "${match[0]}") are not permitted to ensure user safety and compliance with App Store Guideline 1.1.`,
    };
  }

  return { isSafe: true };
}
