import { ComponentPropsWithoutRef, HTMLProps } from "react";
import Typography from "./Typography";

type Props = {
  label?: string;
  inputProps?: ComponentPropsWithoutRef<"input">;
} & HTMLProps<HTMLDivElement>;

const TextInput = ({}: Props) => {
  return (
    <div>
      <Typography>Label</Typography>
    </div>
  );
};

export default TextInput;
