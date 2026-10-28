import classNames from "classnames";
import { ComponentProps, useEffect, useState } from "react";
import { inputClass } from "./Field";
import Icon from "./Icon";

type Props = {
  /** Called with the text once typing pauses. */
  onSearch: (query: string) => void;
  /** Starting text, e.g. the search that's already applied. */
  defaultValue?: string;
  /** How long typing has to pause before `onSearch`, in ms. */
  delay?: number;
} & Omit<ComponentProps<"input">, "type" | "value" | "defaultValue">;

/** Search field with a magnifier, no visible label; give it an `aria-label`. */
const SearchInput = ({
  onSearch,
  defaultValue = "",
  delay = 200,
  className,
  ...props
}: Props) => {
  const [typed, setTyped] = useState(defaultValue);
  useEffect(() => {
    const id = setTimeout(() => onSearch(typed), delay);
    return () => clearTimeout(id);
  }, [typed, delay, onSearch]);
  return (
    <span className={classNames("relative block", className)}>
      <Icon
        name="search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
      <input
        type="search"
        // White with a line, like a secondary button: the ground fill vanishes on the page.
        className={classNames(
          inputClass,
          "pl-9 bg-surface! not-focus:border-line-strong",
        )}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        {...props}
      />
    </span>
  );
};

export default SearchInput;
