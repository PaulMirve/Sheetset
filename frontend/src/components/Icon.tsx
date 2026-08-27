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

const findSVG = (name: string) =>
  CONTEXT[`../assets/icons/${name}.svg`] ?? null;

const Icon = ({
  color = "medium-grey",
  name,
  style,
  size = 18,
  ...props
}: Props) => {
  const SvgIcon = findSVG(name);

  if (!SvgIcon) {
    return null;
  }

  return (
    <SvgIcon
      width={size}
      height={size}
      style={{
        ...(color && { color: `var(--color-${color})` }),
        ...style,
      }}
      {...props}
    />
  );
};

export default Icon;
