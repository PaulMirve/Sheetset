import { ComponentProps } from "react";
import { typography } from "./Typography";

type Props = {
  /** The saved title. Emptying the field and leaving it restores this. */
  defaultValue: string;
  /** Called with the trimmed title on every edit that leaves it non-empty. */
  onChange: (title: string) => void;
} & Omit<ComponentProps<"textarea">, "defaultValue" | "onChange" | "rows">;

// Fit the height to the text, so long titles wrap instead of scrolling.
const grow = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

/**
 * A dialog title you can edit in place: Headline Small text that looks static
 * until hovered or focused. It grows with the text, Enter finishes editing,
 * and a title can't be saved empty.
 */
const EditableTitle = ({ defaultValue, onChange, ...props }: Props) => (
  <textarea
    ref={grow}
    rows={1}
    maxLength={200}
    defaultValue={defaultValue}
    onInput={(e) => {
      grow(e.currentTarget);
      const title = e.currentTarget.value.trim();
      if (title) onChange(title);
    }}
    onKeyDown={(e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      e.currentTarget.blur();
    }}
    onBlur={(e) => {
      if (e.currentTarget.value.trim()) return;
      e.currentTarget.value = defaultValue;
      grow(e.currentTarget);
    }}
    className={typography({
      variant: "headline-sm",
      className:
        "block w-[calc(100%+12px)] -ml-3 px-3 py-2 rounded-[10px] bg-transparent text-ink resize-none overflow-hidden outline-none hover:bg-ground focus:bg-ground focus:shadow-[0_0_0_2px_var(--color-primary)]",
    })}
    {...props}
  />
);

export default EditableTitle;
