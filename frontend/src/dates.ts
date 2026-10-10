// Dates as the app shows them. A `YYYY-MM-DD` day has no time zone, so it's read as local midnight.

const toDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00` : iso);

/** "Sep 24", or "Sep 24, 2026" with `year`, from a `YYYY-MM-DD` day or an ISO timestamp. */
export const fmtDate = (iso: string, year = false) =>
  toDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(year && { year: "numeric" }),
  });

/** Today (or `offset` days from it) as `YYYY-MM-DD`, in local time. */
export const localDay = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA");
};
