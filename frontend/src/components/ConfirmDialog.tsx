import { ReactNode, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import Typography from "./Typography";

type Props = {
  /** Dialog heading, e.g. "Delete board?". */
  title: string;
  /** What will happen, in a sentence or two. */
  children: ReactNode;
  /** Danger button text, e.g. "Delete board". */
  confirmLabel: string;
  /** The destructive action. The dialog closes when it resolves and shows the error when it rejects. */
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
};

/** Asks before a destructive action. Cancel is focused first, so Enter doesn't delete. */
const ConfirmDialog = ({
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) => {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
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
          <Button variant="quiet" onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </span>
      }
    >
      <Typography as="p">{children}</Typography>
      {error && (
        <Typography as="p" role="alert" color="alert">
          {error}
        </Typography>
      )}
    </Modal>
  );
};

export default ConfirmDialog;
