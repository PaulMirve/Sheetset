import classNames from "classnames";
import { useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import Button, { button } from "./Button";
import Field, { a11yProps, FieldProps, inputClass } from "./Field";
import Icon from "./Icon";
import { typography } from "./Typography";

type Props = FieldProps & {
  /** Submits the value with the form, like a native input. */
  name?: string;
  /** Controlled value, `YYYY-MM-DD` or "" for none. */
  value?: string;
  /** Starting value when uncontrolled. */
  defaultValue?: string;
  /** Called with `YYYY-MM-DD`, or "" when cleared. */
  onChange?: (value: string) => void;
  placeholder?: string;
};

// Local-time conversions; `YYYY-MM-DD` has no time zone.
const toDate = (v: string) => new Date(`${v}T00:00`);
const toValue = (d: Date) => d.toLocaleDateString("en-CA");
const display = (v: string) =>
  toDate(v).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Labelled date field with a calendar popover (DESIGN.md "Inputs / Fields").
 * Replaces `<input type="date">`, whose picker can't be styled in WebKit.
 * Arrow keys move between days, Enter picks, Esc closes.
 */
const DatePicker = ({
  label,
  icon,
  error,
  optional,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "Pick a date",
}: Props) => {
  const id = useId();
  const popId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const v = value ?? own;

  const set = (next: string) => {
    setOwn(next);
    onChange?.(next);
    pop.current?.hidePopover();
    trigger.current?.focus();
  };

  // Left-aligned under the field, placed when it opens.
  const place = () => {
    const r = trigger.current!.getBoundingClientRect();
    Object.assign(pop.current!.style, {
      top: `${r.bottom + 6}px`,
      left: `${r.left}px`,
    });
  };

  return (
    <Field {...{ id, label, icon, error, optional }}>
      <button
        ref={trigger}
        type="button"
        popoverTarget={popId}
        {...a11yProps(id, error)}
        className={classNames(
          inputClass,
          "flex items-center justify-between gap-2 text-left tabular-nums cursor-pointer",
          !v && "text-muted/85",
        )}
      >
        {v ? display(v) : placeholder}
        <Icon name="cal" className="flex-none text-muted" />
      </button>
      {name && <input type="hidden" name={name} value={v} />}
      <div
        ref={pop}
        id={popId}
        popover="auto"
        aria-label={`Choose ${label.toLowerCase()}`}
        onBeforeToggle={(e) => e.newState === "open" && place()}
        onToggle={(e) => setOpen(e.newState === "open")}
        className="fixed inset-auto m-0 p-3 rounded-[14px] bg-surface text-ink border border-line shadow-lift open:animate-[menu-pop_.18s_var(--ease-out)]"
      >
        {/* Mounted on open so it focuses the selected day (or today). */}
        {open && (
          <DayPicker
            mode="single"
            required
            autoFocus
            showOutsideDays
            selected={v ? toDate(v) : undefined}
            defaultMonth={v ? toDate(v) : undefined}
            onSelect={(d) => set(toValue(d))}
            components={{
              Chevron: ({ orientation }) => (
                <Icon
                  name="chevron-down"
                  className={classNames(
                    "flex-none",
                    orientation === "left" ? "rotate-90" : "-rotate-90",
                  )}
                />
              ),
            }}
            classNames={{
              root: "tabular-nums select-none",
              months: "relative",
              month_caption: "flex items-center h-[30px] pl-2 mb-2",
              caption_label: typography({ variant: "title" }),
              nav: "absolute top-0 right-0 z-[1] flex gap-0.5",
              button_previous: button({ variant: "icon" }),
              button_next: button({ variant: "icon" }),
              month_grid: "border-collapse",
              weekday: classNames(
                typography({ variant: "chip" }),
                "w-10 h-8 text-muted",
              ),
              day: "p-0.5 text-center",
              day_button:
                "size-9 rounded-[10px] transition-[background-color,color,box-shadow] duration-150 hover:bg-primary-wash outline-none focus-visible:shadow-[0_0_0_2px_var(--color-primary)]",
              today: "[&>button]:font-bold [&>button]:text-primary",
              selected:
                "[&>button]:bg-primary! [&>button]:text-on-primary! [&>button]:font-semibold [&>button]:shadow-[0_4px_12px_-4px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]",
              outside: "[&>button]:text-muted/55",
            }}
          />
        )}
        <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-line">
          <Button variant="quiet" onClick={() => set(toValue(new Date()))}>
            Today
          </Button>
          {optional && v && (
            <Button variant="quiet" onClick={() => set("")}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </Field>
  );
};

export default DatePicker;
