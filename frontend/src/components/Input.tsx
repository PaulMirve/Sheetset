import classNames from "classnames";
import { ComponentProps, useId } from "react";
import Field, { a11yProps, FieldProps, inputClass } from "./Field";

type Props = FieldProps & {
  type?: "text" | "number" | "date" | "email" | "password";
} & Omit<ComponentProps<"input">, "type">;

const Input = ({
  label,
  icon,
  error,
  optional,
  type = "text",
  className,
  ...props
}: Props) => {
  const id = useId();
  return (
    <Field {...{ id, label, icon, error, optional }}>
      <input
        type={type}
        className={classNames(
          inputClass,
          { "tabular-nums": type !== "text" },
          className,
        )}
        {...a11yProps(id, error)}
        {...props}
      />
    </Field>
  );
};

export default Input;
