import classnames from "classnames";
import { HTMLProps } from "react";

type Props = {
  active: boolean;
} & HTMLProps<HTMLDivElement>;

const Toggle = ({ active, className, ...props }: Props) => {
  return (
    <div
      className={classnames(
        "bg-main-purple w-10 h-5 rounded-full relative cursor-pointer",
        className,
      )}
      {...props}
    >
      <div
        className={classnames(
          "bg-[#FFFFFF] w-3.5 h-3.5 rounded-full absolute top-0.75 left-0.75 transition-all",
          { "translate-x-5": active, "translate-x-0": !active },
        )}
      ></div>
    </div>
  );
};

export default Toggle;
