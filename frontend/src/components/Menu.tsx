import type { IconName } from "@system-types/IconName";
import classNames from "classnames";
import { ReactNode, useId, useRef } from "react";
import Button from "./Button";
import Icon from "./Icon";

export type MenuItem =
  | {
      label: string;
      icon: IconName;
      onSelect: () => void;
      /** Destructive action, shown in alert red. */
      danger?: boolean;
    }
  | "-";

type Props = {
  /** Accessible name of the menu (and of the ⋯ trigger), e.g. "Board options". */
  label: string;
  /** Actions in order; "-" draws a divider. */
  items: MenuItem[];
  /** Content for a custom trigger row (the rail's account button) instead of ⋯. */
  trigger?: ReactNode;
  /** Shown above the items, e.g. who is signed in. */
  header?: ReactNode;
  /** Which trigger edge the menu lines up with. */
  align?: "start" | "end";
  className?: string;
};

/**
 * A ⋯ icon button that opens a list of actions (DESIGN.md "Menus").
 * Built on the native popover: Esc and clicking outside close it.
 */
const Menu = ({
  label,
  items,
  trigger,
  header,
  align = "end",
  className,
}: Props) => {
  const id = useId();
  const anchor = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  // Placed when it opens: under the trigger, or above it in the bottom half of the screen.
  const place = () => {
    const r = anchor.current!.getBoundingClientRect();
    const up = r.top > window.innerHeight / 2;
    Object.assign(pop.current!.style, {
      top: up ? "auto" : `${r.bottom + 6}px`,
      bottom: up ? `${window.innerHeight - r.top + 6}px` : "auto",
      left: align === "start" ? `${r.left}px` : "auto",
      right: align === "end" ? `${window.innerWidth - r.right}px` : "auto",
    });
  };

  return (
    <>
      {trigger ? (
        <button
          ref={anchor}
          type="button"
          popoverTarget={id}
          aria-label={label}
          className={classNames(
            "flex items-center gap-2.5 w-full p-2 rounded-xl text-left transition-colors duration-150 hover:bg-ground",
            className,
          )}
        >
          {trigger}
        </button>
      ) : (
        <Button
          ref={anchor}
          variant="icon"
          aria-label={label}
          popoverTarget={id}
          className={className}
        >
          <Icon name="more" />
        </Button>
      )}
      <div
        ref={pop}
        id={id}
        popover="auto"
        aria-label={label}
        onBeforeToggle={(e) => e.newState === "open" && place()}
        className="fixed inset-auto m-0 min-w-[200px] p-1.5 rounded-[14px] bg-surface text-ink border border-line shadow-lift open:animate-[menu-pop_.18s_var(--ease-out)]"
      >
        {header && (
          <>
            <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2.5">
              {header}
            </div>
            <hr className="my-1.5 mx-1 border-line" />
          </>
        )}
        {items.map((it, i) =>
          it === "-" ? (
            <hr key={i} className="my-1.5 mx-1 border-line" />
          ) : (
            <button
              key={it.label}
              type="button"
              className={classNames(
                "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[9px] text-left font-[550] outline-none transition-colors duration-150",
                it.danger
                  ? "text-alert hover:bg-alert-wash focus-visible:bg-alert-wash"
                  : "hover:bg-ground focus-visible:bg-ground [&>svg]:text-muted",
              )}
              onClick={() => {
                pop.current!.hidePopover();
                it.onSelect();
              }}
            >
              <Icon name={it.icon} />
              {it.label}
            </button>
          ),
        )}
      </div>
    </>
  );
};

export default Menu;
