import { Column } from "@system-types/column";
import { ToDo } from "@system-types/ToDo";
import classNames from "classnames";
import { useState } from "react";
import { fmtDate } from "../dates";
import { epicHue, hashHue, hue } from "../hue";
import { BoardView, TaskActions, canMove, doneColumn } from "../tasks";
import Button from "./Button";
import EditableTitle from "./EditableTitle";
import Icon from "./Icon";
import Menu from "./Menu";
import Tag from "./Tag";
import { Source, TaskBody, TaskProperties, useTaskSave } from "./TaskParts";
import { DueTag } from "./ToDoCard";
import Typography from "./Typography";

type Props = BoardView &
  TaskActions & {
    todo: ToDo;
    onBack: () => void;
    // Back to the board, with this task's card highlighted.
    onShowOnBoard: () => void;
  };

const Sep = () => (
  <Icon
    name="chevron-down"
    size={14}
    className="flex-none -rotate-90 text-muted opacity-60"
  />
);

// The board's columns as a track; the task sits on one stage and moves with a click.
const Stages = ({
  columns,
  at,
  onMove,
  todo,
  todos,
}: {
  columns: Column[];
  at: number;
  todo: ToDo;
  todos: ToDo[];
  onMove: (c: Column) => void;
}) => (
  <ol
    aria-label="Column"
    className="flex items-center overflow-x-auto p-0.5 max-md:-mx-4 max-md:px-4"
  >
    {columns.map((c, i) => {
      const here = i === at;
      return (
        <li
          key={c.id}
          style={hue(i + 1)}
          className={classNames(
            "flex items-center",
            i ? "flex-[1_0_auto]" : "flex-none",
          )}
        >
          {i > 0 && (
            <span
              aria-hidden
              className={classNames(
                "flex-[1_0_18px] h-0.5 mx-1.5 rounded-full transition-colors duration-300",
                i <= at
                  ? "bg-[color-mix(in_srgb,var(--h)_55%,transparent)]"
                  : "bg-line-strong",
              )}
            />
          )}
          <Button
            variant="bare"
            aria-current={here ? "step" : undefined}
            disabled={!canMove(todo, c.id, todos, columns)}
            title={here ? undefined : `Move to ${c.name}`}
            onClick={() => !here && onMove(c)}
            className={classNames(
              "inline-flex items-center gap-2 flex-none rounded-full whitespace-nowrap transition-[background-color,box-shadow,color] duration-150",
              here
                ? "h-11 pl-3.5 pr-[18px] cursor-default text-[color-mix(in_srgb,var(--h)_62%,var(--color-ink))] bg-[color-mix(in_srgb,var(--h)_16%,var(--color-surface))] shadow-[inset_0_0_0_2px_var(--h)]"
                : i < at
                  ? "h-10 pl-3 pr-[15px] text-[color-mix(in_srgb,var(--h)_58%,var(--color-ink))] bg-[color-mix(in_srgb,var(--h)_12%,var(--color-surface))] hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--h)_60%,transparent)]"
                  : "h-10 pl-3 pr-[15px] text-muted bg-surface shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] hover:text-ink hover:bg-[color-mix(in_srgb,var(--h)_6%,var(--color-surface))] hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--h)_60%,transparent)]",
            )}
          >
            {i < at ? (
              <Icon name="check" size={16} style={{ color: "var(--h)" }} />
            ) : (
              <span
                className={classNames(
                  "rounded-full",
                  here
                    ? "size-2.5 bg-(--h) shadow-[0_0_0_3px_color-mix(in_srgb,var(--h)_22%,transparent)]"
                    : "size-[9px] shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--h)_60%,transparent)]",
                )}
              />
            )}
            <Typography
              as="span"
              variant={here ? "title" : "label"}
              color="inherit"
            >
              {c.name}
            </Typography>
          </Button>
        </li>
      );
    })}
  </ol>
);

// Where an epic's tasks sit across the board, one segment per column.
const Spread = ({
  columns,
  epicTasks,
}: {
  columns: Column[];
  epicTasks: ToDo[];
}) => {
  const count = columns.map(
    (c) => epicTasks.filter((t) => t.column === c.id).length,
  );
  const done = epicTasks.filter((t) => t.column === doneColumn(columns)).length;
  const total = epicTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <section aria-label="Where this epic’s tasks are" className="grid gap-2.5">
      <Typography color="muted" className="flex items-baseline gap-2.5">
        <Typography
          as="b"
          variant="title"
          color="inherit"
          className={classNames(
            "tabular-nums",
            total && done === total ? "text-(--hue-4)" : "text-ink",
          )}
        >
          {done} of {total} done
        </Typography>
        {total ? (
          <span className="tabular-nums">{pct}%</span>
        ) : (
          <span>Add tasks below to see them spread across the board.</span>
        )}
      </Typography>
      <div
        role="img"
        aria-label={columns
          .map((c, i) => `${count[i]} in ${c.name}`)
          .join(", ")}
        className={classNames("flex gap-[3px] h-3", {
          "rounded-full bg-line-strong": !total,
        })}
      >
        {columns.map(
          (c, i) =>
            count[i] > 0 && (
              <i
                key={c.id}
                title={`${count[i]} in ${c.name}`}
                style={{ ...hue(i + 1), flexGrow: count[i] }}
                className="min-w-3 rounded-full bg-[color-mix(in_srgb,var(--h)_80%,var(--color-surface))] transition-[flex-grow] duration-300"
              />
            ),
        )}
      </div>
      {total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {columns.map((c, i) => (
            <Tag
              key={c.id}
              style={hue(i + 1)}
              dot={c.id !== doneColumn(columns)}
              icon={c.id === doneColumn(columns) ? "check" : undefined}
              className={classNames({ "opacity-50": !count[i] })}
            >
              {count[i]} {c.name}
            </Tag>
          ))}
        </div>
      )}
    </section>
  );
};

/** The complete view of one task or epic, at #/boards/<id>/tasks/<id>. */
const TaskPage = ({
  board,
  columns,
  todos,
  labels,
  todo,
  onChange,
  onChangeTask,
  onCreate,
  onOpenTask,
  onOpenMeeting,
  onDelete,
  onBack,
  onShowOnBoard,
}: Props) => {
  const { errors, save } = useTaskSave(onChange);
  const [copied, setCopied] = useState(false);
  const parent = todos.find((t) => t.isEpic && t.id === todo.epic);
  const epicTasks = todos.filter((t) => t.epic === todo.id);
  const columnIndex = columns.findIndex((c) => c.id === todo.column);
  const done = todo.column === doneColumn(columns);
  const kind = todo.isEpic ? "epic" : "task";

  const copyLink = () =>
    navigator.clipboard?.writeText(location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

  return (
    <div
      aria-label={`${todo.isEpic ? "Epic" : "Task"}: ${todo.title}`}
      className="min-h-0 overflow-auto"
    >
      <div className="grid gap-[22px] max-w-[1200px] mx-auto px-7 pt-[18px] pb-12 max-md:px-4 max-md:pt-3 max-md:pb-8 max-md:gap-[18px]">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 min-h-10"
        >
          <Button
            variant="quiet"
            onClick={onBack}
            autoFocus
            className="-ml-2.5 text-ink!"
          >
            <Icon name="arrow-left" />
            <span
              aria-hidden
              className="tile size-[22px] rounded-[7px] text-[12px]"
              style={hashHue(String(board.id))}
            >
              {board.name[0].toUpperCase()}
            </span>
            {board.name}
          </Button>
          {parent && (
            <>
              <Sep />
              <Button
                variant="bare"
                title="Open the epic"
                onClick={() => onOpenTask(parent.id)}
                className="min-w-0 rounded-full hover:brightness-95"
              >
                <Tag icon="layers" style={epicHue(parent.id)}>
                  {parent.title}
                </Tag>
              </Button>
            </>
          )}
          <Sep />
          <Typography
            as="span"
            variant="label"
            color="muted"
            aria-current="page"
            title={todo.title}
          >
            {todo.key}
          </Typography>
          <span className="flex items-center gap-1 ml-auto">
            <Button variant="quiet" onClick={copyLink}>
              <Icon name={copied ? "check" : "link"} />
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Menu
              label="More actions"
              items={[
                {
                  icon: "trash",
                  label: `Delete ${kind}`,
                  danger: true,
                  onSelect: onDelete,
                },
              ]}
            />
          </span>
        </nav>

        <header className="flex items-start gap-4">
          {todo.isEpic && (
            <span
              aria-hidden
              className="tile size-[52px] rounded-2xl mt-0.5 max-md:hidden"
              style={epicHue(todo.id)}
            >
              <Icon name="layers" size={26} />
            </span>
          )}
          <div className="flex-1 min-w-0 grid gap-2.5">
            <EditableTitle
              variant="headline"
              aria-label={todo.isEpic ? "Epic name" : "Title"}
              defaultValue={todo.title}
              onChange={(title) => save({ title })}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {todo.isEpic && (
                <Tag icon="layers" style={epicHue(todo.id)}>
                  Epic · {epicTasks.length} task
                  {epicTasks.length === 1 ? "" : "s"}
                </Tag>
              )}
              {done && !todo.isEpic && (
                <Tag icon="check" style={hue(4)}>
                  Done
                </Tag>
              )}
              {todo.due && <DueTag due={todo.due} />}
              {todo.label && (
                <Tag dot style={hashHue(todo.label)}>
                  {todo.label}
                </Tag>
              )}
              {todo.source && (
                <Tag icon="video" style={hue(3)}>
                  {todo.source.title}
                </Tag>
              )}
            </div>
          </div>
        </header>

        {todo.isEpic ? (
          <Spread columns={columns} epicTasks={epicTasks} />
        ) : (
          <Stages
            columns={columns}
            at={columnIndex}
            todo={todo}
            todos={todos}
            onMove={(c) => save({ column: c.id })}
          />
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_320px] rounded-[20px] bg-surface shadow-rest max-lg:grid-cols-1 max-md:rounded-2xl">
          <div className="min-w-0 grid content-start gap-[30px] px-[30px] pt-[26px] pb-[30px] max-md:p-4">
            {todo.source && (
              <Source
                source={todo.source}
                onOpenMeeting={() => onOpenMeeting(todo.source!.meeting_id)}
              />
            )}
            <TaskBody
              todo={todo}
              board={board}
              columns={columns}
              todos={todos}
              onOpenTask={onOpenTask}
              onChangeTask={onChangeTask}
              onCreate={onCreate}
              save={save}
              errors={errors}
              notesClassName="min-h-[132px]"
            />
          </div>

          <aside
            aria-label="Properties"
            className="p-6 border-l border-line max-lg:order-first max-lg:border-l-0 max-lg:border-b max-md:p-4"
          >
            <div className="sticky top-5 grid gap-4 max-lg:static max-lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <TaskProperties
                todo={todo}
                columns={columns}
                todos={todos}
                labels={labels}
                save={save}
                errors={errors}
              />
              <Typography
                as="dl"
                variant="label"
                className="col-span-full grid gap-3 py-4 my-1 border-y border-line [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&_dt]:inline-flex [&_dt]:items-center [&_dt]:gap-[7px] [&_dt]:text-muted [&_dd]:ml-auto [&_dd]:tabular-nums"
              >
                <div>
                  <dt>
                    <Icon name="plus" size={15} />
                    Created
                  </dt>
                  <dd>{fmtDate(todo.created_at, true)}</dd>
                </div>
                <div>
                  <dt>
                    <Icon name="pen" size={15} />
                    Last updated
                  </dt>
                  <dd>{fmtDate(todo.updated_at, true)}</dd>
                </div>
              </Typography>
              <Button
                variant="secondary"
                onClick={onShowOnBoard}
                className="col-span-full w-full"
              >
                <Icon name="board" /> Show on the board
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
