import { cva, VariantProps } from "class-variance-authority";
import classNames from "classnames";
import { ComponentProps } from "react";

const button = cva("button", {
  variants: {
    variant: {
      primary: "bg-main-purple enabled:hover:bg-main-purple-hover text-text-light",
      secondary: "bg-main-purple/10 enabled:hover:bg-main-purple/25 text-main-purple",
      destruction: "bg-red enabled:hover:bg-red-hover text-text-light",
    },
    size: {
      large: "h-12 font-bold text-[15px]",
      small: "h-10 font-bold text-[13px]",
    },
  },
});

type Props = {} & VariantProps<typeof button> & ComponentProps<"button">;

const Button = ({
  children,
  variant = "primary",
  size = "large",
  className,
  ...props
}: Props) => {
  return (
    <button
      className={button({
        variant,
        size,
        className: classNames(
          "rounded-full flex items-center justify-center w-fit cursor-pointer px-15 transition-colors duration-200 disabled:opacity-25 disabled:cursor-not-allowed",
          className,
        ),
      })}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
