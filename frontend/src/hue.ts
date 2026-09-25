import type { CSSProperties } from "react";

// Assigned Hue Rule: position (1-based) or hash → one of six hues, exposed as --h.
export const hue = (n: number) =>
  ({
    "--h": `var(--hue-${((((n - 1) % 6) + 6) % 6) + 1})`,
  }) as CSSProperties;

export const hashHue = (s: string) =>
  hue([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));

// An epic's hue comes from its own id, and identifies it everywhere.
export const epicHue = (id: number) => hashHue(`epic${id}`);
