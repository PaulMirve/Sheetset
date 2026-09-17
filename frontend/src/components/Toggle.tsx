import classnames from "classnames";
import { ComponentProps } from "react";

type Props = {
  active: boolean;
} & ComponentProps<"button">;

const Toggle = ({ active, className, ...props }: Props) => (
  <button
    role="switch"
    aria-checked={active}
    className={classnames(
      "w-10 h-[22px] rounded-full relative transition-colors duration-150",
      active ? "bg-primary" : "bg-line-strong",
      className,
    )}
    {...props}
  >
    <span
      className={classnames(
        "bg-white w-4 h-4 rounded-full absolute top-[3px] left-[3px] shadow-rest transition-transform duration-150 ease-out",
        { "translate-x-[18px]": active },
      )}
    />
  </button>
);

export default Toggle;
