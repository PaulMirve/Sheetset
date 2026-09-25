import type { IconName } from "@system-types/IconName";
import classNames from "classnames";
import { useId, useRef } from "react";
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
  /** Accessible name of the ⋯ trigger, e.g. "Board options". */
  label: string;
  /** Actions in order; "-" draws a divider. */
  items: MenuItem[];
  className?: string;
};

/**
 * A ⋯ icon button that opens a list of actions (DESIGN.md "Menus").
 * Built on the native popover: Esc and clicking outside close it.
 */
const Menu = ({ label, items, className }: Props) => {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  // Right-aligned under the trigger, placed when it opens.
  const place = () => {
    const r = trigger.current!.getBoundingClientRect();
    Object.assign(pop.current!.style, {
      top: `${r.bottom + 6}px`,
      right: `${window.innerWidth - r.right}px`,
    });
  };

  return (
    <>
      <Button
        ref={trigger}
        variant="icon"
        aria-label={label}
        popoverTarget={id}
        className={className}
      >
        <Icon name="more" />
      </Button>
      <div
        ref={pop}
        id={id}
        popover="auto"
        onBeforeToggle={(e) => e.newState === "open" && place()}
        className="fixed inset-auto m-0 min-w-[200px] p-1.5 rounded-[14px] bg-surface text-ink border border-line shadow-lift open:animate-[menu-pop_.18s_var(--ease-out)]"
      >
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
