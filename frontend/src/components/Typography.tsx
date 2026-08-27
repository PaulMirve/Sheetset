import { cva, type VariantProps } from "class-variance-authority";
import { HTMLProps } from "react";
import { ColorName } from "../types/colors";
import classNames from "classnames";

const typography = cva("typography", {
  variants: {
    variant: {
      "heading-xl": "font-bold text-[24px] leading-7.5",
      "heading-l": "font-bold text-[18px] leading-5.75",
      "heading-m": "font-bold text-[15px] leading-4.75",
      "heading-s": "font-bold text-[12px] leading-3.75 tracking-[2.4px]",
      "body-large": "font-medium text-[13px] leading-5.75",
      "body-medium": "font-bold text-[12px] leading-3.75",
    },
  },
});

type Props = { color?: ColorName } & VariantProps<typeof typography> &
  HTMLProps<HTMLDivElement>;

const Typography = ({
  children,
  variant,
  className,
  color = "black",
  ...props
}: Props) => {
  return (
    <div
      className={typography({
        variant,
        className: classNames(`text-${color}`, className),
      })}
      {...props}
    >
      {children}
    </div>
  );
};

export default Typography;
