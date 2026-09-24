import type { IconName } from "@system-types/IconName";
import { ReactNode } from "react";
import Icon from "./Icon";

// Shared look for Input, TextArea and Select (DESIGN.md "Inputs / Fields").
export const inputClass =
  "w-full h-11 px-3 rounded-[10px] bg-ground text-ink border border-transparent outline-none placeholder:text-muted/85 transition-[background-color,border-color,box-shadow] duration-150 hover:border-line-strong focus:bg-surface focus:border-primary focus:shadow-[0_0_0_4px_var(--color-primary-wash)] aria-invalid:border-alert aria-invalid:shadow-[0_0_0_4px_var(--color-alert-wash)] disabled:opacity-45 disabled:cursor-not-allowed";

export type FieldProps = {
  /** Visible label above the control, in sentence case. */
  label: string;
  /** Line icon shown before the label. */
  icon?: IconName;
  /** Message shown under the control; also marks it invalid for assistive tech. */
  error?: string;
  /** Adds a muted "optional" hint after the label. */
  optional?: boolean;
};

type Props = FieldProps & { id: string; children: ReactNode };

const Field = ({ id, label, icon, error, optional, children }: Props) => (
  <div className="grid gap-1.5">
    <label
      htmlFor={id}
      className="flex items-center gap-1.5 font-semibold text-[14px] text-muted"
    >
      {icon && <Icon name={icon} size={15} />}
      {label}
      {optional && <span className="font-medium opacity-75">optional</span>}
    </label>
    {children}
    {error && (
      <div id={`${id}-error`} role="alert" className="text-alert text-[14.5px]">
        {error}
      </div>
    )}
  </div>
);

// Props every control spreads onto its native element.
export const a11yProps = (id: string, error?: string) => ({
  id,
  "aria-invalid": !!error || undefined,
  "aria-describedby": error ? `${id}-error` : undefined,
});

export default Field;
