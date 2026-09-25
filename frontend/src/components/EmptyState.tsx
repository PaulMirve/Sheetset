import type { IconName } from "@system-types/IconName";
import classNames from "classnames";
import { ReactNode } from "react";
import { hue } from "../hue";
import Icon from "./Icon";
import Typography from "./Typography";

type Props = {
  /** Line icon in the hue tile. */
  icon: IconName;
  /** Heading, e.g. "No boards yet". */
  title: string;
  /** One sentence on what to do next. */
  children: ReactNode;
  /** The action that fills the space, usually one primary `Button`. */
  action?: ReactNode;
  className?: string;
};

/** Centered placeholder for an area with nothing in it yet: a hue tile, heading, hint and one action. */
const EmptyState = ({ icon, title, children, action, className }: Props) => (
  <div
    className={classNames(
      "grid justify-items-center content-center gap-2 p-8 text-center",
      className,
    )}
  >
    <span
      className="tile w-16 h-16 rounded-[20px] mb-2"
      style={hue(1)}
      aria-hidden
    >
      <Icon name={icon} size={28} />
    </span>
    <Typography as="h2" variant="headline-sm">
      {title}
    </Typography>
    <Typography as="p" color="muted" className="max-w-[38ch]">
      {children}
    </Typography>
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export default EmptyState;
