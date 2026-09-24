import classNames from "classnames";
import { ComponentProps } from "react";

/**
 * Borderless text input for editing text in place, inside a row that draws
 * the field itself (hover border, focus ring), like a subtask row.
 * It has no label of its own, so always pass an `aria-label`.
 */
const InlineInput = ({ className, ...props }: ComponentProps<"input">) => (
  <input
    autoComplete="off"
    className={classNames(
      "flex-1 min-w-0 h-full bg-transparent text-ink outline-none placeholder:text-muted/85",
      className,
    )}
    {...props}
  />
);

export default InlineInput;
