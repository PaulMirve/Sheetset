import classNames from "classnames";
import { ComponentProps, useId } from "react";
import Field, { a11yProps, FieldProps, inputClass } from "./Field";
import Icon from "./Icon";

type Option = { value: string; label: string };

type Props = FieldProps & { options: Option[] } & ComponentProps<"select">;

// Native select with the design's chevron.
const Select = ({
  label,
  icon,
  error,
  optional,
  options,
  className,
  ...props
}: Props) => {
  const id = useId();
  return (
    <Field {...{ id, label, icon, error, optional }}>
      <div className="relative">
        <select
          className={classNames(inputClass, "appearance-none pr-8", className)}
          {...a11yProps(id, error)}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevron-down"
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
        />
      </div>
    </Field>
  );
};

export default Select;
