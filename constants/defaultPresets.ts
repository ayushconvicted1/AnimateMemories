import defaultPresetsData from "./defaultPresets.json";
import defaultCategoriesData from "./defaultCategories.json";

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
  isStar?: boolean;
  image?: any;
}

export const FALLBACK_TEMPLATES: TemplatePresetItem[] = (
  (defaultPresetsData as any)?.result || []
).map((item: any) => ({
  ...item,
  isStar: Boolean(item.sortOrder && item.sortOrder < 10) || item.views?.includes("M"),
  hasAudio: Boolean(item.hasAudio || item.slug === "mic-drop-rap" || item.slug === "groove-duo"),
}));

export const FALLBACK_CATEGORIES: string[] = (
  (defaultCategoriesData as any)?.result || []
).map((c: any) => c.name).filter((val: string, idx: number, self: string[]) => self.indexOf(val) === idx);
