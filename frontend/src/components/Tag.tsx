import type { IconName } from "@system-types/IconName";
import classNames from "classnames";
import { ComponentProps } from "react";
import Icon from "./Icon";

type Props = {
  icon?: IconName;
  // Leading hue dot, used by label tags.
  dot?: boolean;
} & ComponentProps<"span">;

// Tinted by --h (style={hashHue(label)} or hue(n)); neutral without it.
const Tag = ({ icon, dot, className, children, ...props }: Props) => (
  <span
    className={classNames(
      "chip inline-flex items-center gap-[5px] h-[25px] px-[9px] min-w-0 rounded-full font-semibold text-[13.5px] leading-none tabular-nums whitespace-nowrap",
      className,
    )}
    {...props}
  >
    {dot && <span className="size-1.5 rounded-full flex-none bg-(--h)" />}
    {icon && <Icon name={icon} size={14} />}
    <span className="truncate">{children}</span>
  </span>
);

export default Tag;
