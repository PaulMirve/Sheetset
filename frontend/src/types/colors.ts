export const COLOR_NAMES = [
  "ink",
  "muted",
  "primary",
  "alert",
  "on-primary",
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];
