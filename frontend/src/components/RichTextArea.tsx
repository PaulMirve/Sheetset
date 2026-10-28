import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import classNames from "classnames";
import { useId, useState } from "react";
import Field, { FieldProps, inputClass } from "./Field";

type Props = FieldProps & {
  /** Markdown shown when the editor mounts; later changes are ignored, like a textarea's defaultValue. */
  defaultValue?: string;
  /** Called with the markdown on every edit. */
  onChange?: (markdown: string) => void;
  /** Submits the markdown with a form, like a textarea's name. */
  name?: string;
  placeholder?: string;
  className?: string;
};

// Underline has no markdown syntax; links stay in the app (Tauri webview).
const extensions = [
  StarterKit.configure({ underline: false, link: { openOnClick: false } }),
  Markdown,
];

/** Read-only markdown, styled like the notes field. */
export const RichText = ({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) => {
  const editor = useEditor(
    {
      extensions,
      editable: false,
      content: markdown,
      contentType: "markdown",
      editorProps: {
        attributes: { class: classNames("rich leading-[1.55]", className) },
      },
    },
    [markdown],
  );
  return <EditorContent editor={editor} />;
};

/** Labelled rich-text field for notes; stored and emitted as markdown. */
const RichTextArea = ({
  label,
  icon,
  error,
  optional,
  defaultValue = "",
  onChange,
  name,
  placeholder,
  className,
}: Props) => {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const editor = useEditor({
    extensions: [...extensions, Placeholder.configure({ placeholder })],
    content: defaultValue,
    contentType: "markdown",
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        class: classNames(
          inputClass,
          "rich h-auto min-h-[120px] py-2.5 leading-[1.55]",
          className,
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown();
      setValue(md);
      onChange?.(md);
    },
  });
  return (
    <Field {...{ id, label, icon, error, optional }}>
      <EditorContent editor={editor} />
      {name && <input type="hidden" name={name} value={value} />}
    </Field>
  );
};

export default RichTextArea;
