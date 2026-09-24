import classNames from "classnames";
import { ComponentProps, ReactNode } from "react";
import Typography from "./Typography";

type Props = {
  /** Text shown next to the box. Without it, pass an `aria-label`. */
  label?: ReactNode;
  /** Partly checked, e.g. a "select all" box when only some rows are. */
  indeterminate?: boolean;
  /** `sm` (18px) for lists and headers, `md` (20px) for selectable cards. */
  size?: "sm" | "md";
} & Omit<ComponentProps<"input">, "type" | "size">;

/** Native checkbox tinted Action Blue via accent-color, as DESIGN.md specifies. */
const Checkbox = ({
  label,
  indeterminate = false,
  size = "sm",
  className,
  ...props
}: Props) => {
  const box = (
    <input
      type="checkbox"
      // `indeterminate` only exists as a DOM property, not an attribute.
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      className={classNames(
        "flex-none accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "size-[18px]" : "size-5",
        className,
      )}
      {...props}
    />
  );
  if (!label) return box;
  return (
    <Typography
      as="label"
      variant="label"
      color="muted"
      className="inline-flex items-center gap-2 cursor-pointer"
    >
      {box}
      {label}
    </Typography>
  );
};

export default Checkbox;
