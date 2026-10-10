import {
  MAX_FILE,
  fileUrlQuery,
  useDeleteFile,
  useFileUrl,
  useUploadFiles,
} from "@hooks/useTasks";
import { TaskFile } from "@system-types/task";
import { ToDo } from "@system-types/ToDo";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { fmtDate } from "../dates";
import { hashHue } from "../hue";
import Button from "./Button";
import FileButton from "./FileButton";
import Icon from "./Icon";
import Typography from "./Typography";

const isImage = (f: TaskFile) => f.type.startsWith("image/");
const extOf = (name: string) =>
  (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "file").toLowerCase();
const fmtSize = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${Math.round(n / 1024)} KB`
      : `${(n / 1048576).toFixed(1)} MB`;
const meta = (f: TaskFile) => `${fmtSize(f.size)} · ${fmtDate(f.created_at)}`;

const removeClass =
  "hover:text-alert! hover:bg-alert-wash! opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100";

const Thumb = ({ file, ...props }: { file: TaskFile; className?: string }) => {
  const url = useFileUrl(file.id).data;
  return url ? (
    <img src={url} alt={file.name} {...props} />
  ) : (
    <span className={props.className} />
  );
};

/** Full-screen viewer; arrows and ←/→ step through the task's photos. */
const Viewer = ({
  photos,
  start,
  onRemove,
  onClose,
}: {
  photos: TaskFile[];
  start: number;
  onRemove: (f: TaskFile) => void;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const f = photos[Math.min(i, photos.length - 1)];
  const url = useFileUrl(f.id).data;
  const step = (d: number) => setI((i + d + photos.length) % photos.length);
  useEffect(() => ref.current?.showModal(), []);

  return (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      onCancel={(e) => {
        e.preventDefault();
        // React bubbles this to the task dialog, which would close too.
        e.stopPropagation();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
      className="fixed inset-0 m-0 w-screen h-screen max-w-none max-h-none p-0 bg-transparent text-white outline-none open:grid grid-rows-[auto_minmax(0,1fr)] backdrop:bg-[rgba(12,13,19,.9)] open:animate-[fade_.2s_var(--ease-out)]"
    >
      <header className="flex items-center gap-3 py-3.5 pr-4 pl-6 max-md:pl-4 [&_button]:text-white/80 [&_button]:enabled:hover:text-white [&_button]:enabled:hover:bg-white/12">
        <div className="flex-1 min-w-0 grid">
          <Typography variant="title" color="inherit" className="truncate">
            {f.name}
          </Typography>
          <Typography variant="chip" color="inherit" className="opacity-70">
            {photos.length > 1 && `${i + 1} of ${photos.length} · `}
            {meta(f)}
          </Typography>
        </div>
        <a
          href={url}
          download={f.name}
          aria-label="Download"
          title="Download"
          className="grid place-items-center size-10 rounded-xl text-white/80 hover:text-white hover:bg-white/12"
        >
          <Icon name="download" />
        </a>
        <Button
          variant="icon"
          aria-label="Remove this photo"
          title="Remove"
          className="size-10"
          onClick={() => {
            onRemove(f);
            if (photos.length === 1) onClose();
          }}
        >
          <Icon name="trash" />
        </Button>
        <Button
          variant="icon"
          aria-label="Close viewer"
          className="size-10"
          onClick={onClose}
        >
          <Icon name="cross" />
        </Button>
      </header>
      <div
        className="relative grid place-items-center min-h-0 px-[72px] pt-2 pb-8 max-md:px-3 max-md:pb-[88px] [&>button]:text-white/80 [&>button]:enabled:hover:text-white [&>button]:enabled:hover:bg-white/12"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {url && (
          <img
            key={f.id}
            src={url}
            alt={f.name}
            className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-xl shadow-lift animate-[modal-rise_.24s_var(--ease-out)]"
          />
        )}
        {photos.length > 1 && (
          <>
            <Button
              variant="icon"
              aria-label="Previous photo"
              onClick={() => step(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 size-12! rounded-full! bg-white/10 max-md:top-auto max-md:bottom-5 max-md:translate-y-0"
            >
              <Icon name="arrow-left" />
            </Button>
            <Button
              variant="icon"
              aria-label="Next photo"
              onClick={() => step(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 size-12! rounded-full! bg-white/10 max-md:top-auto max-md:bottom-5 max-md:translate-y-0"
            >
              <Icon name="arrow" />
            </Button>
          </>
        )}
      </div>
    </dialog>
  );
};

/**
 * A task's photos and files: browse, drop anywhere on the surrounding dialog, or paste.
 * Photos open in a full-screen viewer; other files open in a new tab or download.
 */
const Files = ({ boardId, todo }: { boardId: number; todo: ToDo }) => {
  const upload = useUploadFiles(boardId, todo.id);
  const del = useDeleteFile(boardId, todo.id);
  const qc = useQueryClient();
  const ref = useRef<HTMLElement>(null);
  const [dropping, setDropping] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<number | null>(null);
  const photos = todo.files.filter(isImage);
  const docs = todo.files.filter((f) => !isImage(f));

  const add = (list: File[]) => {
    const big = list.filter((f) => f.size > MAX_FILE);
    setError(
      big.length
        ? `${big.length > 1 ? `${big.length} files are` : `“${big[0].name}” is`} over 10 MB, so ${big.length > 1 ? "they weren’t" : "it wasn’t"} attached.`
        : "",
    );
    const ok = list.filter((f) => f.size <= MAX_FILE);
    if (ok.length)
      upload.mutate(ok, {
        onError: (e) => setError(`Couldn’t attach: ${e.message}`),
      });
  };
  // Keep the latest `add` for the listeners bound once below.
  const addRef = useRef(add);
  addRef.current = add;

  const open = async (f: TaskFile, download = false) => {
    const a = document.createElement("a");
    a.href = await qc.fetchQuery(fileUrlQuery(f.id));
    if (download) a.download = f.name;
    else a.target = "_blank";
    a.click();
  };

  // The whole dialog accepts drops and pastes. Only file drags light it up, not card drags.
  useEffect(() => {
    const zone = ref.current?.closest("dialog");
    if (!zone) return;
    const hasFiles = (e: DragEvent) =>
      [...(e.dataTransfer?.types ?? [])].includes("Files");
    let depth = 0;
    const on: Record<string, (e: Event) => void> = {
      dragenter: (e) =>
        hasFiles(e as DragEvent) && ++depth && setDropping(true),
      dragleave: (e) => {
        if (hasFiles(e as DragEvent) && --depth <= 0) {
          depth = 0;
          setDropping(false);
        }
      },
      dragover: (e) => hasFiles(e as DragEvent) && e.preventDefault(),
      drop: (e) => {
        const d = e as DragEvent;
        if (!hasFiles(d)) return;
        d.preventDefault();
        depth = 0;
        setDropping(false);
        addRef.current([...d.dataTransfer!.files]);
      },
      paste: (e) => {
        const files = [...((e as ClipboardEvent).clipboardData?.files ?? [])];
        if (!files.length) return;
        e.preventDefault();
        addRef.current(files);
      },
    };
    Object.entries(on).forEach(([k, f]) => zone.addEventListener(k, f));
    return () =>
      Object.entries(on).forEach(([k, f]) => zone.removeEventListener(k, f));
  }, []);

  return (
    <section
      ref={ref}
      aria-label="Files"
      className="relative grid grid-cols-[minmax(0,1fr)] gap-2.5 rounded-[14px]"
    >
      {dropping && (
        <Typography
          variant="label"
          color="primary"
          aria-hidden
          className="absolute -inset-2 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary-wash"
        >
          Drop to attach
        </Typography>
      )}
      <Typography
        variant="label"
        color="muted"
        className="flex items-center gap-1.5 min-h-[34px]"
      >
        <Icon name="clip" size={15} />
        Files
        {todo.files.length > 0 && (
          <>
            <span className="ml-auto tabular-nums">{todo.files.length}</span>
            <FileButton
              variant="quiet"
              multiple
              className="ml-2 h-[34px]"
              onFiles={add}
              disabled={upload.isPending}
            >
              <Icon name="plus" />
              {upload.isPending ? "Attaching…" : "Add files"}
            </FileButton>
          </>
        )}
      </Typography>
      {photos.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {photos.map((f, i) => (
            <figure
              key={f.id}
              className="group relative grid gap-1.5 m-0 min-w-0"
            >
              <Button
                variant="bare"
                aria-label={`View ${f.name}`}
                onClick={() => setViewing(i)}
                className="aspect-4/3 overflow-hidden rounded-xl bg-ground shadow-[inset_0_0_0_1px_var(--color-line)] cursor-zoom-in transition-[box-shadow,transform] duration-150 hover:shadow-lift hover:-translate-y-px"
              >
                <Thumb file={f} className="block size-full object-cover" />
              </Button>
              <Typography
                as="figcaption"
                variant="chip"
                color="muted"
                className="truncate px-0.5"
                title={`${f.name} · ${meta(f)}`}
              >
                {f.name}
              </Typography>
              <Button
                variant="icon"
                aria-label={`Remove ${f.name}`}
                title="Remove"
                onClick={() => del.mutate(f.id)}
                className={classNames(
                  "absolute top-1.5 right-1.5 bg-surface! shadow-rest",
                  removeClass,
                )}
              >
                <Icon name="trash" size={15} />
              </Button>
            </figure>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
          {docs.map((f) => (
            <div
              key={f.id}
              style={hashHue(extOf(f.name))}
              className="group flex items-center gap-2.5 h-[52px] pl-2 pr-1.5 rounded-[10px] bg-ground border border-transparent hover:border-line-strong"
            >
              <span className="grid place-items-center size-9 rounded-[10px] flex-none bg-[color-mix(in_srgb,var(--h)_16%,transparent)] text-[color-mix(in_srgb,var(--h)_62%,var(--color-ink))]">
                <Icon name="file" size={18} />
              </span>
              <Button
                variant="bare"
                title={`Open ${f.name} in a new tab`}
                onClick={() => open(f)}
                className="flex-1 min-w-0 grid text-left hover:[&>:first-child]:underline"
              >
                <Typography variant="label" className="truncate">
                  {f.name}
                </Typography>
                <Typography variant="chip" color="muted" className="truncate">
                  {meta(f)}
                </Typography>
              </Button>
              <Button
                variant="icon"
                aria-label={`Download ${f.name}`}
                title="Download"
                onClick={() => open(f, true)}
              >
                <Icon name="download" size={15} />
              </Button>
              <Button
                variant="icon"
                aria-label={`Remove ${f.name}`}
                title="Remove"
                onClick={() => del.mutate(f.id)}
                className={removeClass}
              >
                <Icon name="trash" size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}
      {todo.files.length === 0 && (
        <FileButton
          variant="bare"
          multiple
          onFiles={add}
          disabled={upload.isPending}
          className="grid justify-items-center gap-1 py-5 px-4 rounded-[14px] border-[1.5px] border-dashed border-line-strong text-muted transition-colors hover:border-primary hover:bg-primary-wash hover:text-ink"
        >
          <Icon name="upload" size={22} color="primary" />
          <Typography as="span" color="inherit">
            {upload.isPending ? (
              "Attaching…"
            ) : (
              <>
                Drop photos or files here, or{" "}
                <Typography as="span" variant="label" color="primary">
                  browse
                </Typography>
              </>
            )}
          </Typography>
          <Typography
            as="span"
            variant="chip"
            color="inherit"
            className="opacity-85"
          >
            Up to 10 MB each. You can also paste a screenshot.
          </Typography>
        </FileButton>
      )}
      {error && (
        <Typography as="p" role="alert" color="alert">
          {error}
        </Typography>
      )}
      {viewing != null && photos.length > 0 && (
        <Viewer
          photos={photos}
          start={viewing}
          onRemove={(f) => del.mutate(f.id)}
          onClose={() => setViewing(null)}
        />
      )}
    </section>
  );
};

export default Files;
