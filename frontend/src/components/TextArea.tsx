import classNames from "classnames";
import { ComponentProps, useId } from "react";
import Field, { a11yProps, FieldProps, inputClass } from "./Field";

type Props = FieldProps & ComponentProps<"textarea">;

/** Labelled multi-line field for notes; the user can resize it vertically. */
const TextArea = ({
  label,
  icon,
  error,
  optional,
  className,
  ...props
}: Props) => {
  const id = useId();
  return (
    <Field {...{ id, label, icon, error, optional }}>
      <textarea
        className={classNames(
          inputClass,
          "h-auto min-h-[120px] py-2.5 leading-[1.55] resize-y",
          className,
        )}
        {...a11yProps(id, error)}
        {...props}
      />
    </Field>
  );
};

export default TextArea;
