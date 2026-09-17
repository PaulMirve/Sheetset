import classNames from "classnames";
import { ComponentProps, ReactNode, useEffect, useRef } from "react";
import Button from "./Button";
import Icon from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  // Heading slot: plain text or an editable title.
  title: ReactNode;
  // Tags row above the title.
  crumbs?: ReactNode;
  footer?: ReactNode;
} & Omit<ComponentProps<"dialog">, "open" | "title">;

// Native <dialog>: focus trap, Esc and backdrop come free.
// Sized to content; only the body shrinks (and scrolls) at max height.
const Modal = ({
  open,
  onClose,
  title,
  crumbs,
  footer,
  children,
  className,
  ...props
}: Props) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Browsers focus the first control; only focus a field that opts in.
      (dialog.querySelector<HTMLElement>("[data-autofocus]") ?? dialog).focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Backdrop click: the dialog itself is the target only outside its content.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={classNames(
        "m-auto p-0 w-[min(620px,100vw-32px)] max-h-[min(740px,100vh-48px)] rounded-[20px] bg-surface text-ink shadow-lift backdrop:bg-[rgba(19,21,29,.45)] outline-none open:flex flex-col open:animate-[modal-rise_.24s_var(--ease-out)] backdrop:animate-[fade_.24s_var(--ease-out)]",
        className,
      )}
      {...props}
    >
      <div className="shrink-0 grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2 pt-[22px] pr-[18px] pb-1.5 pl-6">
        {crumbs && (
          <div className="col-span-full flex flex-wrap gap-1.5">{crumbs}</div>
        )}
        <div className="self-center min-w-0">{title}</div>
        <Button variant="icon" aria-label="Close" onClick={onClose}>
          <Icon name="cross" />
        </Button>
      </div>
      <div className="min-h-0 overflow-auto grid content-start gap-[18px] px-6 pt-4 pb-[22px]">
        {children}
      </div>
      {footer && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-6 py-3.5 border-t border-line text-muted text-[14px]">
          {footer}
        </div>
      )}
    </dialog>
  );
};

export default Modal;
