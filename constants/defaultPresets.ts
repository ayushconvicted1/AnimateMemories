import { Platform } from "react-native";
import defaultPresetsData from "./defaultPresets.json";
import defaultCategoriesData from "./defaultCategories.json";
import { filterTemplatesForPlatform } from "@/lib/safetyFilter";

export interface TemplatePresetItem {
  id: number | string;
  slug: string;
  name: string;
  prompt: string;
  thumbnailUrl: string;
  videoUrl?: string | null;
  category: string;
  views?: string;
  rating?: string;
  sortOrder?: number;
  isActive?: boolean;
  hasAudio?: boolean;
  hideFromIos?: boolean;
  isStar?: boolean;
  image?: any;
}

const rawTemplates: TemplatePresetItem[] = (
  (defaultPresetsData as any)?.result || []
).map((item: any) => ({
  ...item,
  isStar: Boolean(item.sortOrder && item.sortOrder < 10) || item.views?.includes("M"),
  hasAudio: Boolean(item.hasAudio || item.slug === "mic-drop-rap" || item.slug === "groove-duo"),
}));

export const FALLBACK_TEMPLATES: TemplatePresetItem[] = filterTemplatesForPlatform(
  rawTemplates,
  Platform.OS
);

export const FALLBACK_CATEGORIES: string[] = (
  (defaultCategoriesData as any)?.result || []
)
  .map((c: any) => c.name)
  .filter((val: string, idx: number, self: string[]) => self.indexOf(val) === idx)
  .filter((c: string) => {
    if (!c) return false;
    const lower = c.toLowerCase();
    if (Platform.OS === "ios" && (lower === "wedding" || lower === "couples" || lower === "romance")) {
      return false;
    }
    return true;
  });
