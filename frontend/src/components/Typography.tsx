import { cva, type VariantProps } from "class-variance-authority";
import { HTMLProps } from "react";
import { ColorName } from "../types/colors";
import classNames from "classnames";

const typography = cva("", {
  variants: {
    variant: {
      headline: "font-extrabold text-[30px] leading-[1.15] tracking-[-0.025em]",
      "headline-sm":
        "font-[750] text-[24px] leading-[1.25] tracking-[-0.015em]",
      title: "font-bold text-[16px] leading-[1.35]",
      body: "text-[15.5px] leading-[1.45]",
      "body-lg": "text-[18px] leading-[1.45]",
      label: "font-semibold text-[14px] leading-[1.45]",
      chip: "font-semibold text-[13.5px] leading-none tabular-nums",
    },
  },
});

type Props = { color?: ColorName } & VariantProps<typeof typography> &
  HTMLProps<HTMLDivElement>;

const Typography = ({
  variant = "body",
  className,
  color = "ink",
  ...props
}: Props) => (
  <div
    className={typography({
      variant,
      className: classNames(`text-${color}`, className),
    })}
    {...props}
  />
);

export default Typography;
