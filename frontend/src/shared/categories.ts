export const PROJECT_CATEGORIES = [
  { value: "moda", label: "Moda" },
  { value: "beauty", label: "Beauty" },
  { value: "eventi-club", label: "Club" },
  { value: "video", label: "Video" },
  { value: "sport", label: "Sport" },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]["value"];
export function categoryLabel(category?: string) {
  return PROJECT_CATEGORIES.find((item) => item.value === category)?.label ?? "";
}
