import { cva, type VariantProps } from "class-variance-authority";
import { ComponentPropsWithoutRef, ElementType } from "react";
import { ColorName } from "../types/colors";
import classNames from "classnames";

// The type scale from DESIGN.md "Typography". Exported for form controls
// (e.g. an editable title textarea) that need a level but can't be Typography.
export const typography = cva("", {
  variants: {
    variant: {
      headline: "font-extrabold text-[30px] leading-[1.15] tracking-[-0.025em]",
      "headline-sm":
        "font-[750] text-[24px] leading-[1.25] tracking-[-0.015em]",
      title: "font-bold text-[16px] leading-[1.35]",
      body: "text-[15.5px] leading-[1.45]",
      // Rail row names: Body at 550, 700 on the current row (an aria-current="page" group).
      rail: "font-[550] text-[15.5px] leading-[1.45] group-aria-[current=page]:font-bold",
      "body-lg": "text-[18px] leading-[1.45]",
      label: "font-semibold text-[14px] leading-[1.45]",
      chip: "font-semibold text-[13.5px] leading-none tabular-nums",
      brand: "font-extrabold text-[18px] tracking-[-0.02em]",
    },
  },
});

type Props<T extends ElementType> = {
  // The element to render, for semantics: as="h2", as="p", as="time"…
  as?: T;
  // "inherit" sets no color, for text tinted by its context (e.g. a hue).
  color?: ColorName | "inherit";
} & VariantProps<typeof typography> &
  Omit<ComponentPropsWithoutRef<T>, "as" | "color">;

const Typography = <T extends ElementType = "div">({
  as,
  variant = "body",
  className,
  color = "ink",
  ...props
}: Props<T>) => {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={typography({
        variant,
        className: classNames(
          color !== "inherit" && `text-${color}`,
          className,
        ),
      })}
      {...props}
    />
  );
};

export default Typography;
