import type { IconName } from "@system-types/IconName";
import classNames from "classnames";
import { ComponentProps, useId } from "react";
import Icon from "./Icon";
import Typography from "./Typography";

type Props<T extends string> = {
  /** Accessible name for the group, e.g. "What are you creating?". */
  label: string;
  /** The choices, left to right. */
  options: { value: T; label: string; icon?: IconName }[];
  /** The selected value. */
  value: T;
  /** Called with the newly picked value. */
  onChange: (value: T) => void;
} & Omit<ComponentProps<"div">, "onChange">;

/** One-of-a-few choice drawn as a pill row. Native radios underneath, so arrow keys work. */
const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  ...props
}: Props<T>) => {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={classNames(
        "flex gap-1 p-1 rounded-[10px] bg-ground",
        className,
      )}
      {...props}
    >
      {options.map((o) => (
        <Typography
          as="label"
          key={o.value}
          variant="label"
          color="inherit"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg cursor-pointer text-muted has-checked:bg-primary-wash has-checked:text-primary has-focus-visible:outline-2 has-focus-visible:outline-primary"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={o.value === value}
            onChange={() => onChange(o.value)}
            className="absolute opacity-0 pointer-events-none"
          />
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </Typography>
      ))}
    </div>
  );
};

export default Segmented;
