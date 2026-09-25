import { FormEvent, useId, useState } from "react";
import { errorsOf, nameSchema } from "../forms";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import Typography from "./Typography";

type Props = {
  /** Dialog heading, e.g. "Rename board". */
  title: string;
  /** Field label, e.g. "Board name". */
  label: string;
  /** Current name when renaming. */
  defaultValue?: string;
  /** Primary button text, e.g. "Save" or "Add column". */
  submitLabel: string;
  /** Saves the trimmed name. The dialog closes when it resolves and shows the error when it rejects. */
  onSubmit: (name: string) => Promise<unknown>;
  onClose: () => void;
};

/** Small dialog with one validated name field: rename a board, add or rename a column. */
const NameDialog = ({
  title,
  label,
  defaultValue,
  submitLabel,
  onSubmit,
  onClose,
}: Props) => {
  const formId = useId();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = nameSchema.safeParse(
      Object.fromEntries(new FormData(e.currentTarget)),
    );
    if (!r.success) return setError(errorsOf(r.error).name);
    setSaving(true);
    try {
      await onSubmit(r.data.name);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={title}
      className="w-[min(440px,100vw-32px)]!"
      title={
        <Typography as="h2" variant="headline-sm">
          {title}
        </Typography>
      }
      footer={
        <span className="flex gap-1.5 ml-auto">
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {submitLabel}
          </Button>
        </span>
      }
    >
      <form id={formId} noValidate onSubmit={submit} className="contents">
        <Input
          name="name"
          label={label}
          defaultValue={defaultValue}
          maxLength={60}
          autoComplete="off"
          data-autofocus
          error={error || undefined}
          onChange={() => setError("")}
        />
      </form>
    </Modal>
  );
};

export default NameDialog;
