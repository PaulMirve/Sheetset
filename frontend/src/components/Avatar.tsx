import type { User } from "@system-types/user";
import classNames from "classnames";
import { ComponentProps } from "react";
import { hue } from "../hue";

// Sizes from the wireframes: card footer, default, sidebar "me" row.
const SIZES = {
  sm: "size-[26px] text-[11px]",
  md: "size-7 text-[12px]",
  lg: "size-9 text-[13.5px]",
};

type Props = {
  /** The person shown. Their id picks the hue, their name the initials. */
  user: Pick<User, "id" | "first_name" | "last_name">;
  /** sm 26px (card footer), md 28px (default), lg 36px (sidebar). */
  size?: keyof typeof SIZES;
} & ComponentProps<"span">;

/** A solid hue circle with the person's initials. Named for screen readers. */
const Avatar = ({ user, size = "md", className, style, ...props }: Props) => {
  const name = `${user.first_name} ${user.last_name}`;
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={classNames(
        "tile rounded-full shadow-none select-none",
        SIZES[size],
        className,
      )}
      style={{ ...hue(user.id), ...style }}
      {...props}
    >
      {(user.first_name[0] + (user.last_name[0] ?? "")).toUpperCase()}
    </span>
  );
};

export default Avatar;
