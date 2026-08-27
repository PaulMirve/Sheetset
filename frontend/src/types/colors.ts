export const COLOR_NAMES = [
  "black",
  "very-dark-grey",
  "dark-grey",
  "lines-dark",
  "medium-grey",
  "lines-light",
  "light-grey",
  "white",
  "main-purple",
  "main-purple-hover",
  "red",
  "red-hover",
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];
