import { ComponentProps, useRef } from "react";
import Button from "./Button";

type Props = Omit<ComponentProps<typeof Button>, "onClick"> & {
  /** Called with the files picked, once per pick. */
  onFiles: (files: File[]) => void;
  /** Allow picking more than one file. */
  multiple?: boolean;
  /** File types to offer, like an input's `accept` ("image/*"). */
  accept?: string;
};

/** A Button that opens the system file picker (a hidden native file input). */
const FileButton = ({ onFiles, multiple, accept, ...props }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button {...props} onClick={() => input.current?.click()} />
      <input
        ref={input}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = ""; // so picking the same file again still fires
        }}
      />
    </>
  );
};

export default FileButton;
