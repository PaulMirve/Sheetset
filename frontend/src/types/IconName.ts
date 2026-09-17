export const ICON_NAMES = [
  "board",
  "check",
  "check-circle",
  "chevron-down",
  "cols",
  "cross",
  "eye-slash",
  "eye",
  "inbox",
  "lock",
  "more",
  "notes",
  "plus",
  "theme",
  "users",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
