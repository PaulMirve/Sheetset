import { Board } from "@system-types/Board";
import { Column, ColumnId } from "@system-types/column";
import { ToDoId } from "@system-types/ToDo";
import { Note, SuggestedTask } from "@system-types/meeting";
import classNames from "classnames";
import {
  useAcceptSuggestions,
  useMeeting,
  useMeetings,
} from "@hooks/useMeetings";
import { useId, useRef, useState } from "react";
import { ApiError } from "../api";
import { errorsOf, taskSchema } from "../forms";
import { hashHue, hue } from "../hue";
import Button from "./Button";
import DatePicker from "./DatePicker";
import Icon from "./Icon";
import Input from "./Input";
import Modal from "./Modal";
import Select from "./Select";
import Tag from "./Tag";
import TextArea from "./TextArea";
import Typography from "./Typography";
import { DueTag } from "./ToDoCard";
import Checkbox from "./Checkbox";

type Props = {
  board: Board;
  columns: Column[];
  // Existing labels, suggested in the Label field.
  labels: string[];
  // Ids of the created tasks, in suggestion order.
  onCreated: (ids: ToDoId[]) => void;
  onClose: () => void;
};

// A suggestion as the user is shaping it. `column: ""` means "same as Add to".
type Draft = {
  title: string;
  due: string;
  label: string;
  description: string;
  column: string;
};

const draftOf = (t: SuggestedTask): Draft => ({
  title: t.title,
  due: t.due ?? "",
  label: t.label ?? "",
  description: t.description ?? "",
  column: "",
});

const draftSchema = taskSchema.pick({ title: true, due: true, label: true });

const fmtDate = (d: string) =>
  new Date(`${d}T00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const today = () => new Date().toLocaleDateString("en-CA");
const toColumn = (v: string) => Number(v) as unknown as ColumnId;
const first = (name?: string | null) => (name ?? "").split(" ")[0];

// A speaker's first name, tinted by the --h hue set on the line.
const Speaker = ({ name }: { name?: string | null }) => (
  <Typography
    as="b"
    variant="title"
    color="inherit"
    className="mr-1 text-[color-mix(in_srgb,var(--h)_60%,var(--color-ink))]"
  >
    {first(name)}
  </Typography>
);

const Skeleton = ({ className }: { className?: string }) => (
  <i
    className={classNames(
      "block h-3.5 rounded-lg bg-ground animate-pulse",
      className,
    )}
  />
);

const LoadError = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div
    role="alert"
    className="grid justify-items-start gap-2.5 p-4 rounded-[14px] bg-alert-wash"
  >
    {error instanceof ApiError && error.status === 401
      ? "You’re signed out. Sign in to see your meetings."
      : `Couldn’t load meetings: ${error.message}`}
    <Button variant="secondary" onClick={retry}>
      Try again
    </Button>
  </div>
);

type EditorProps = {
  draft: Draft;
  line?: Note;
  columns: Column[];
  labels: string[];
  edited: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onReset: () => void;
  onDone: () => void;
};

// Details of one suggestion, opened inside its row. Edits save as you type.
const SuggestionEditor = ({
  draft,
  line,
  columns,
  labels,
  edited,
  onChange,
  onReset,
  onDone,
}: EditorProps) => {
  const listId = useId();
  const [titleError, setTitleError] = useState<string>();
  // Remount the fields on Reset so their uncontrolled values follow the draft.
  const [version, setVersion] = useState(0);

  return (
    <div
      role="group"
      aria-label="Details of this suggested task"
      className="col-span-full grid gap-3.5 mt-0.5 pt-3.5 border-t border-line animate-[modal-rise_.2s_var(--ease-out)]"
      onKeyDown={(e) => {
        // Escape closes this editor, not the whole dialog.
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onDone();
        }
      }}
    >
      {line?.text && (
        <Typography
          as="blockquote"
          style={hashHue(line.who ?? "")}
          className="flex gap-2.5 m-0 px-3 py-2 rounded-[10px] bg-[color-mix(in_srgb,var(--hue-2)_12%,var(--color-surface))]"
        >
          <Typography as="time" variant="chip" color="muted" className="pt-1">
            {line.t}
          </Typography>
          <span>
            <Speaker name={line.who} />
            {line.text}
          </span>
        </Typography>
      )}
      <div key={version} className="grid gap-3.5">
        <Input
          label="Title"
          icon="pen"
          autoFocus
          autoComplete="off"
          maxLength={200}
          defaultValue={draft.title}
          error={titleError}
          onChange={(e) => {
            const v = e.target.value.trim();
            setTitleError(v ? undefined : "A task needs a title.");
            if (v) onChange({ title: v });
          }}
          // An emptied title snaps back to the last one it had.
          onBlur={(e) => {
            if (!e.target.value.trim()) {
              e.target.value = draft.title;
              setTitleError(undefined);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onDone();
            }
          }}
        />
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-3 max-sm:grid-cols-1">
          <DatePicker
            label="Due date"
            icon="cal"
            optional
            value={draft.due}
            onChange={(due) => onChange({ due })}
          />
          <Input
            label="Label"
            icon="tag"
            placeholder="e.g. Design"
            maxLength={24}
            autoComplete="off"
            list={listId}
            defaultValue={draft.label}
            onChange={(e) => onChange({ label: e.target.value.trim() })}
          />
          <datalist id={listId}>
            {labels.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <div className="col-span-full">
            <Select
              label="Column"
              icon="status"
              defaultValue={draft.column}
              onChange={(e) => onChange({ column: e.target.value })}
              options={[
                { value: "", label: "Same as “Add to” below" },
                ...columns.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
        </div>
        <TextArea
          label="Notes"
          icon="notes"
          optional
          placeholder="Add context, links or acceptance criteria"
          className="min-h-[84px]!"
          defaultValue={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="quiet"
          disabled={!edited}
          onClick={() => {
            onReset();
            setTitleError(undefined);
            setVersion((v) => v + 1);
          }}
        >
          <Icon name="arrow-left" />
          Reset to suggestion
        </Button>
        <Button variant="secondary" className="ml-auto" onClick={onDone}>
          <Icon name="check" />
          Done
        </Button>
      </div>
    </div>
  );
};

// Pick a meeting → read its notes, AI summary and suggested tasks → create the chosen ones.
const MeetingModal = ({
  board,
  columns,
  labels,
  onCreated,
  onClose,
}: Props) => {
  const [pickedId, setPickedId] = useState<number>();
  // Everything starts selected, so track what the user unticked.
  const [unsel, setUnsel] = useState(new Set<number>());
  // Only edited suggestions have a draft; the AI's version stays for Reset.
  const [edits, setEdits] = useState<Record<number, Draft>>({});
  const [open, setOpen] = useState<number>();
  const [column, setColumn] = useState(columns[0].id);
  const [hl, setHl] = useState<number>();
  // Why a selected suggestion can't be created yet.
  const [invalid, setInvalid] = useState("");
  const notesRef = useRef<HTMLDivElement>(null);

  const meetings = useMeetings();
  const detail = useMeeting(pickedId);
  const list = meetings.data;
  const meeting = detail.data;
  const accept = useAcceptSuggestions(pickedId!, board.id);
  // Suggestions already turned into tasks can't be picked again.
  const all =
    meeting?.tasks.flatMap((t, i) => (t.task_id == null ? [i] : [])) ?? [];
  const sel = new Set(all.filter((i) => !unsel.has(i)));

  const show = (src?: number | null) => {
    setHl(src ?? undefined);
    notesRef.current
      ?.querySelector(`[data-line="${src}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const toggle = (i: number) =>
    setUnsel((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  const draft = (i: number) => edits[i] ?? draftOf(meeting!.tasks[i]);

  const edit = (i: number, patch: Partial<Draft>) => {
    setEdits((prev) => ({
      ...prev,
      [i]: { ...(prev[i] ?? draftOf(meeting!.tasks[i])), ...patch },
    }));
    setInvalid("");
    // Working on a suggestion means you want it.
    setUnsel((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const reset = (i: number) =>
    setEdits((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });

  const closeEditor = () => {
    document.getElementById(`sugg-details-${open}`)?.focus();
    setOpen(undefined);
  };

  const create = () => {
    if (!meeting) return;
    const picked = [...sel].sort((a, b) => a - b);
    for (const i of picked) {
      const d = draft(i);
      const r = draftSchema.safeParse({
        title: d.title,
        due: d.due || undefined,
        label: d.label || undefined,
      });
      if (!r.success) {
        // Open the suggestion so it can be fixed.
        setOpen(i);
        setInvalid(`“${d.title}”: ${Object.values(errorsOf(r.error))[0]}`);
        return;
      }
    }
    setInvalid("");
    accept.mutate(
      picked.map((i) => {
        const t = meeting.tasks[i];
        const d = draft(i);
        const line = t.src != null ? meeting.notes[t.src] : undefined;
        // ponytail: no source field on ToDo yet, so the meeting link lives in the notes.
        const quote = line?.text
          ? `\n\n${first(line.who)}: “${line.text}”`
          : "";
        const source = `From “${meeting.title}”: ${t.why}${quote}`;
        return {
          i,
          title: d.title,
          description: [d.description.trim(), source]
            .filter(Boolean)
            .join("\n\n"),
          column_id: Number(d.column ? toColumn(d.column) : column),
          // null, not undefined: a cleared field must not fall back to the suggestion's.
          due: d.due || null,
          label: d.label || null,
        };
      }),
      {
        onSuccess: (tasks) => {
          onCreated(tasks.map((t) => t.id as unknown as ToDoId));
          onClose();
        },
      },
    );
  };

  const picked = pickedId != null;
  const n = sel.size;
  const total = meeting?.tasks.length ?? 0;
  const back = () => {
    setPickedId(undefined);
    setUnsel(new Set());
    setEdits({});
    setOpen(undefined);
    setHl(undefined);
    accept.reset();
    setInvalid("");
  };

  const title = meeting ? (
    <div className="flex items-start gap-3.5">
      <span
        className="tile w-11 h-11 rounded-[13px]"
        style={hue(3)}
        aria-hidden
      >
        <Icon name="video" size={22} />
      </span>
      <div className="min-w-0">
        <Typography as="h2" variant="headline-sm">
          {meeting.title}
        </Typography>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Tag icon="cal">
            {fmtDate(meeting.date)}
            {meeting.time && ` · ${meeting.time}`}
          </Tag>
          {meeting.duration && <Tag icon="status">{meeting.duration} min</Tag>}
          {meeting.platform && (
            <Tag icon="video" style={hue(6)}>
              {meeting.platform}
            </Tag>
          )}
          {meeting.people.length > 0 && (
            <Tag icon="users">{meeting.people.map(first).join(", ")}</Tag>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3.5">
      <span
        className="tile w-11 h-11 rounded-[13px]"
        style={hue(3)}
        aria-hidden
      >
        <Icon name="spark" size={22} />
      </span>
      <div className="min-w-0">
        <Typography as="h2" variant="headline-sm">
          Create tasks from a meeting
        </Typography>
        <Typography as="p" color="muted" className="mt-0.5">
          Pick a meeting. We’ll read the notes, summarise them and suggest tasks
          for{" "}
          <Typography as="b" variant="title">
            {board.name}
          </Typography>
          .
        </Typography>
      </div>
    </div>
  );

  const pickBody = (
    <div className="grid gap-2.5">
      {meetings.error ? (
        <LoadError error={meetings.error} retry={meetings.refetch} />
      ) : list ? (
        list.map((m) => (
          <button
            key={m.id}
            onClick={() => setPickedId(m.id)}
            style={hue(m.platform === "Zoom" ? 1 : 4)}
            className="group flex items-center gap-3.5 w-full px-4 py-3.5 rounded-[14px] text-left bg-ground transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-surface hover:shadow-lift hover:-translate-y-px"
          >
            <span className="count-pill w-[42px] h-[42px] rounded-xl">
              <Icon name="video" size={20} />
            </span>
            <span className="min-w-0">
              <Typography as="b" variant="title" className="block">
                {m.title}
              </Typography>
              <Typography
                as="small"
                color="muted"
                className="flex flex-wrap gap-x-3 gap-y-1 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.5"
              >
                <span>
                  <Icon name="cal" size={15} />
                  {m.date === today() ? "Today" : fmtDate(m.date)}
                  {m.time && ` · ${m.time}`}
                </span>
                {m.platform && (
                  <span>
                    <Icon name="video" size={15} />
                    {m.platform}
                  </span>
                )}
                <span>
                  <Icon name="check-circle" size={15} />
                  {m.task_count} suggested task
                  {m.task_count === 1 ? "" : "s"}
                </span>
              </Typography>
            </span>
            <Icon
              name="arrow"
              className="flex-none ml-auto text-muted group-hover:text-primary"
            />
          </button>
        ))
      ) : (
        [0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-[14px]" />
        ))
      )}
      {list?.length === 0 && (
        <Typography as="p" color="muted">
          No meetings yet. They show up here once their notes are processed.
        </Typography>
      )}
    </div>
  );

  const reviewBody = (
    <>
      <section
        aria-label="Meeting notes"
        className="min-h-0 overflow-auto px-6 pt-5 pb-6 max-lg:overflow-visible max-lg:min-h-auto"
      >
        <Typography
          as="h3"
          variant="title"
          className="flex items-center gap-2 mb-3"
        >
          <Icon name="notes" />
          Meeting notes
        </Typography>
        {meeting ? (
          <div ref={notesRef} className="grid gap-1">
            {meeting.notes.map((note, i) =>
              note.h ? (
                <Typography
                  as="h4"
                  key={i}
                  variant="label"
                  color="muted"
                  className="mt-3 mb-0.5 px-2.5"
                >
                  {note.h}
                </Typography>
              ) : (
                <div
                  key={i}
                  data-line={i}
                  style={hashHue(note.who ?? "")}
                  className={classNames(
                    "grid grid-cols-[52px_1fr] gap-2.5 px-2.5 py-2 rounded-[10px] transition-[background-color,box-shadow] duration-200",
                    hl === i &&
                      "bg-[color-mix(in_srgb,var(--hue-2)_16%,transparent)] shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--hue-2)_55%,transparent)]",
                  )}
                >
                  <Typography
                    as="time"
                    variant="chip"
                    color="muted"
                    className="pt-1"
                  >
                    {note.t}
                  </Typography>
                  <div>
                    <Speaker name={note.who} />
                    {note.text}
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="grid gap-2.5">
            {[90, 70, 80, 60, 75].map((w) => (
              <Skeleton key={w} />
            ))}
          </div>
        )}
      </section>
      <section
        aria-label="AI results"
        aria-busy={!meeting}
        className="min-h-0 overflow-auto px-6 pt-5 pb-6 border-l border-line max-lg:overflow-visible max-lg:min-h-auto max-lg:border-l-0 max-lg:border-t"
      >
        {detail.error ? (
          <LoadError error={detail.error} retry={detail.refetch} />
        ) : !meeting ? (
          <>
            <Typography
              variant="label"
              color="inherit"
              className="flex items-center gap-2.5 mb-4 text-[color-mix(in_srgb,var(--hue-3)_62%,var(--color-ink))]"
            >
              <Icon
                name="spark"
                className="animate-spin [animation-duration:1.6s]"
              />
              Reading the notes and drafting tasks…
            </Typography>
            <div className="grid gap-2.5">
              <Skeleton className="w-2/5" />
              <Skeleton />
              <Skeleton className="w-4/5 mb-4" />
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-[14px]" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-[22px] px-[18px] py-4 rounded-2xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--hue-3)_12%,var(--color-surface)),color-mix(in_srgb,var(--hue-1)_8%,var(--color-surface)))]">
              <Typography
                as="h3"
                variant="title"
                color="inherit"
                className="flex items-center gap-2 mb-2 text-[color-mix(in_srgb,var(--hue-3)_62%,var(--color-ink))]"
              >
                <Icon name="spark" />
                AI summary
              </Typography>
              <Typography as="p" className="mb-2.5">
                {meeting.summary}
              </Typography>
              <ul className="grid gap-1.5">
                {meeting.decisions.map((d) => (
                  <li key={d} className="flex gap-2">
                    <Icon
                      name="check-circle"
                      className="mt-0.5 text-(--hue-4)"
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <Typography
                as="h3"
                variant="title"
                className="flex items-center gap-2"
              >
                <Icon name="board" />
                Suggested tasks
              </Typography>
              <span className="ml-auto">
                <Checkbox
                  checked={n === total && total > 0}
                  indeterminate={n > 0 && n < total}
                  onChange={(e) =>
                    setUnsel(new Set(e.target.checked ? [] : all))
                  }
                  label={`${n} of ${total} selected`}
                />
              </span>
            </div>
            <div className="grid gap-2">
              {meeting.tasks.map((t, i) => {
                const d = draft(i);
                const added = t.task_id != null;
                const col = columns.findIndex((c) => String(c.id) === d.column);
                const editing = open === i;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => show(t.src)}
                    onMouseLeave={() => setHl(undefined)}
                    onFocus={() => show(t.src)}
                    className={classNames(
                      "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3.5 py-3 rounded-[14px] transition-[background-color,box-shadow] duration-150",
                      sel.has(i)
                        ? "bg-primary-wash shadow-[inset_0_0_0_1.5px_var(--color-primary)]"
                        : "bg-surface shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]",
                      editing &&
                        "shadow-[inset_0_0_0_1.5px_var(--color-primary),var(--shadow-lift)]!",
                    )}
                  >
                    <label className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 cursor-pointer">
                      <Checkbox
                        size="md"
                        aria-label={`Create “${d.title}”`}
                        checked={sel.has(i)}
                        disabled={added}
                        onChange={() => toggle(i)}
                        className="mt-px"
                      />
                      <div
                        className={classNames(
                          "transition-opacity",
                          !sel.has(i) && "opacity-55",
                        )}
                      >
                        <Typography variant="title">
                          {d.title}
                          {added && (
                            <Typography
                              as="span"
                              variant="chip"
                              color="muted"
                              className="ml-1.5 align-[1px]"
                            >
                              Added
                            </Typography>
                          )}
                          {edits[i] && (
                            <Typography
                              as="span"
                              variant="chip"
                              color="primary"
                              className="ml-1.5 align-[1px]"
                            >
                              Edited
                            </Typography>
                          )}
                        </Typography>
                        <Typography color="muted" className="mt-0.5">
                          {t.why}
                        </Typography>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {board.shared && (
                            <Tag icon="users">
                              {t.who ? first(t.who) : "Unassigned"}
                            </Tag>
                          )}
                          {d.due && <DueTag due={d.due} />}
                          {d.label && (
                            <Tag dot style={hashHue(d.label)}>
                              {d.label}
                            </Tag>
                          )}
                          {col >= 0 && (
                            <Tag icon="status" style={hue(col + 1)}>
                              {columns[col].name}
                            </Tag>
                          )}
                          {d.description.trim() && (
                            <Tag icon="notes">Notes</Tag>
                          )}
                        </div>
                      </div>
                    </label>
                    <Button
                      id={`sugg-details-${i}`}
                      variant="icon"
                      aria-expanded={editing}
                      aria-label={`Details of “${d.title}”`}
                      title="Details"
                      className={classNames(
                        editing && "text-primary! bg-primary-wash",
                      )}
                      onClick={() => (editing ? closeEditor() : setOpen(i))}
                    >
                      <Icon name="notes" />
                    </Button>
                    {editing && (
                      <SuggestionEditor
                        draft={d}
                        line={t.src != null ? meeting.notes[t.src] : undefined}
                        columns={columns}
                        labels={[
                          ...new Set([
                            ...labels,
                            ...meeting.tasks.flatMap((x) => x.label ?? []),
                          ]),
                        ]}
                        edited={!!edits[i]}
                        onChange={(patch) => edit(i, patch)}
                        onReset={() => reset(i)}
                        onDone={closeEditor}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      aria-label="Create tasks from a meeting"
      className={classNames(
        "w-[min(1120px,100vw-32px)]!",
        picked && "h-[min(780px,100vh-40px)] max-h-none!",
      )}
      bodyClassName={classNames(
        "border-t border-line mt-4",
        picked &&
          "flex-1 p-0! gap-0! content-stretch! grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] grid-rows-[minmax(0,1fr)] max-lg:grid-cols-1 max-lg:grid-rows-none",
      )}
      title={title}
      footer={
        meeting ? (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="[&>div]:grid-cols-[auto_180px] [&>div]:items-center [&>div]:gap-2.5">
              <Select
                label="Add to"
                icon="status"
                value={String(column)}
                onChange={(e) =>
                  setColumn(Number(e.target.value) as unknown as ColumnId)
                }
                options={columns.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
              />
            </div>
            {invalid && (
              <Typography as="p" role="alert" color="alert">
                {invalid}
              </Typography>
            )}
            {accept.error && (
              <Typography as="p" role="alert" color="alert">
                Couldn’t create tasks: {accept.error.message}
              </Typography>
            )}
            <span className="flex gap-1.5 ml-auto">
              <Button variant="quiet" onClick={back}>
                <Icon name="arrow-left" /> Other meeting
              </Button>
              <Button disabled={!n || accept.isPending} onClick={create}>
                <Icon name="plus" />
                {n
                  ? `Create ${n} task${n > 1 ? "s" : ""}`
                  : "Select tasks to create"}
              </Button>
            </span>
          </div>
        ) : (
          <span className="flex gap-1.5 ml-auto">
            {picked && (
              <Button variant="quiet" onClick={back}>
                Back
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </span>
        )
      }
    >
      {picked ? reviewBody : pickBody}
    </Modal>
  );
};

export default MeetingModal;
