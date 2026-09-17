import type { ColorName } from "@system-types/colors";
import type { IconName } from "@system-types/IconName";
import type { FC, SVGProps } from "react";

type Props = {
  name: IconName;
  color?: ColorName;
  size?: number;
} & SVGProps<SVGSVGElement>;

const CONTEXT = import.meta.glob("../assets/icons/*.svg", {
  query: "?react",
  import: "default",
  eager: true,
}) as Record<string, FC<SVGProps<SVGSVGElement>>>;

const Icon = ({ color, name, style, size = 17, ...props }: Props) => {
  const SvgIcon = CONTEXT[`../assets/icons/${name}.svg`];
  if (!SvgIcon) return null;

  // No color → inherit currentColor from the parent.
  return (
    <SvgIcon
      width={size}
      height={size}
      aria-hidden
      className="flex-none"
      style={{ ...(color && { color: `var(--color-${color})` }), ...style }}
      {...props}
    />
  );
};

export default Icon;
