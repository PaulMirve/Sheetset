import classNames from "classnames";
import { KeyboardEvent, useId, useRef, useState } from "react";
import Field, { a11yProps, FieldProps, inputClass } from "./Field";
import Icon from "./Icon";
import { typography } from "./Typography";

type Option = {
  value: string;
  label: string;
  /** Muted lead-in before the label, e.g. a task key. */
  hint?: string;
  disabled?: boolean;
};

type Props = FieldProps & {
  /** Choices, in display order. */
  options: Option[];
  /** Submits the value with the form, like a native select. */
  name?: string;
  /** Controlled value. */
  value?: string;
  /** Starting value when uncontrolled. */
  defaultValue?: string;
  /** Called with the picked option's value. */
  onChange?: (value: string) => void;
  disabled?: boolean;
  title?: string;
};

/**
 * Labelled select with a listbox popover (DESIGN.md "Inputs / Fields").
 * Replaces `<select>`, whose menu can't be styled in WebKit.
 * Arrows/Home/End move, typing jumps, Enter or Space picks, Esc closes.
 */
const Select = ({
  label,
  icon,
  error,
  optional,
  options,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  title,
}: Props) => {
  const id = useId();
  const popId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [own, setOwn] = useState(defaultValue ?? options[0]?.value ?? "");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const v = value ?? own;
  const current = options.find((o) => o.value === v) ?? options[0];

  const optionId = (i: number) => `${popId}-${i}`;

  const move = (i: number) => {
    setActive(i);
    document.getElementById(optionId(i))?.scrollIntoView({ block: "nearest" });
  };

  // Next enabled option from `from` in direction `step`, or `from` itself.
  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir)
      if (!options[i].disabled) return i;
    return from;
  };

  const pick = (o: Option) => {
    if (o.disabled) return;
    setOwn(o.value);
    if (o.value !== v) onChange?.(o.value);
    pop.current?.hidePopover();
    trigger.current?.focus();
  };

  // Under the field (above when the bottom is tight), at least as wide as it.
  const place = () => {
    const r = trigger.current!.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const up = below < 240 && r.top > below;
    Object.assign(pop.current!.style, {
      top: up ? "auto" : `${r.bottom + 6}px`,
      bottom: up ? `${window.innerHeight - r.top + 6}px` : "auto",
      left: `${r.left}px`,
      minWidth: `${r.width}px`,
      maxWidth: `${Math.max(r.width, Math.min(480, window.innerWidth - r.left - 12))}px`,
      maxHeight: `${Math.min(340, (up ? r.top : below) - 6)}px`,
    });
  };

  const onOpen = () => {
    const i = options.indexOf(current);
    list.current!.focus();
    move(i < 0 || options[i]?.disabled ? step(-1, 1) : i);
  };

  const typeahead = (key: string) => {
    const now = Date.now();
    const t = typed.current;
    t.text = (now - t.at > 600 ? "" : t.text) + key.toLowerCase();
    t.at = now;
    const hit = options.findIndex(
      (o) =>
        !o.disabled &&
        (o.label.toLowerCase().startsWith(t.text) ||
          o.hint?.toLowerCase().startsWith(t.text)),
    );
    if (hit >= 0) move(hit);
  };

  const onListKey = (e: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(step(active, 1)),
      ArrowUp: () => move(step(active, -1)),
      Home: () => move(step(-1, 1)),
      End: () => move(step(options.length, -1)),
      Enter: () => options[active] && pick(options[active]),
      " ": () =>
        typed.current.text
          ? typeahead(" ")
          : options[active] && pick(options[active]),
      Tab: () => pop.current!.hidePopover(),
    };
    if (keys[e.key]) {
      if (e.key !== "Tab") e.preventDefault();
      keys[e.key]();
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) typeahead(e.key);
  };

  return (
    <Field {...{ id, label, icon, error, optional }}>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={popId}
        aria-expanded={open}
        popoverTarget={popId}
        disabled={disabled}
        title={title}
        {...a11yProps(id, error)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            pop.current!.showPopover();
          }
        }}
        className={classNames(
          inputClass,
          "group flex items-center gap-2 text-left cursor-pointer",
          !v && "text-muted",
        )}
      >
        <span className="flex-1 min-w-0 truncate">
          {current?.hint && (
            <span className="mr-1.5 text-muted tabular-nums">
              {current.hint}
            </span>
          )}
          {current?.label}
        </span>
        <Icon
          name="chevron-down"
          size={14}
          className="flex-none text-muted transition-transform duration-200 ease-(--ease-out) group-aria-expanded:rotate-180"
        />
      </button>
      {name && <input type="hidden" name={name} value={v} />}
      <div
        ref={pop}
        id={popId}
        popover="auto"
        onBeforeToggle={(e) => e.newState === "open" && place()}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) onOpen();
          else typed.current.text = "";
        }}
        // `open:flex` only: a plain `flex` would beat the UA's `display: none` and keep it shown.
        className="fixed inset-auto m-0 open:flex flex-col rounded-[14px] bg-surface text-ink border border-line shadow-lift overflow-hidden open:animate-[menu-pop_.18s_var(--ease-out)]"
      >
        <div
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          onKeyDown={onListKey}
          className="overflow-y-auto overscroll-contain p-1.5 outline-none"
        >
          {options.map((o, i) => {
            const selected = o === current;
            return (
              <div
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                aria-disabled={o.disabled || undefined}
                onMouseMove={() => !o.disabled && i !== active && setActive(i)}
                onClick={() => pick(o)}
                className={classNames(
                  "flex items-center gap-2.5 min-h-10 px-2.5 py-2 rounded-[9px] cursor-pointer select-none transition-colors duration-100",
                  i === active && "bg-ground",
                  selected ? "text-primary font-semibold" : "font-[550]",
                  !o.value && !selected && "text-muted",
                  o.disabled && "opacity-45 cursor-not-allowed",
                )}
              >
                {o.hint && (
                  <span
                    className={classNames(
                      typography({ variant: "chip" }),
                      "flex-none",
                      selected ? "text-primary/75" : "text-muted",
                    )}
                  >
                    {o.hint}
                  </span>
                )}
                <span className="flex-1 min-w-0 truncate">{o.label}</span>
                <Icon
                  name="check"
                  size={16}
                  className={classNames("flex-none", !selected && "invisible")}
                />
              </div>
            );
          })}
        </div>
      </div>
    </Field>
  );
};

export default Select;
