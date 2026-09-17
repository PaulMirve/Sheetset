import { cva, VariantProps } from "class-variance-authority";
import { ComponentProps } from "react";

const button = cva(
  "inline-flex items-center justify-center gap-[7px] h-10 rounded-[10px] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:enabled:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "px-4 bg-primary text-on-primary shadow-[0_1px_2px_rgba(0,0,0,.1),0_4px_12px_-4px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] enabled:hover:bg-[color-mix(in_srgb,var(--color-primary)_88%,#000)]",
        secondary:
          "px-4 bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] enabled:hover:bg-primary-wash",
        quiet:
          "px-2.5 text-muted enabled:hover:text-ink enabled:hover:bg-primary-wash",
        danger:
          "px-4 bg-alert-wash text-alert enabled:hover:bg-[color-mix(in_srgb,var(--color-alert)_20%,transparent)]",
        icon: "w-[30px] h-[30px] rounded-[9px] text-muted enabled:hover:bg-primary-wash enabled:hover:text-ink",
      },
    },
  },
);

type Props = VariantProps<typeof button> & ComponentProps<"button">;

const Button = ({ variant = "primary", className, ...props }: Props) => (
  <button className={button({ variant, className })} {...props} />
);

export default Button;
