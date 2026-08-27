export const ICON_NAMES = [
  "board",
  "check",
  "chevron-down",
  "cross",
  "ellipsis-vertical",
  "eye-slash",
  "eye",
  "moon",
  "sun",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
