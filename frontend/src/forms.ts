// Form schemas. Limits mirror the backend's; the server re-validates everything.
import { ColumnId } from "@system-types/column";
import { Subtask } from "@system-types/Subtask";
import { ToDoId } from "@system-types/ToDo";
import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(1, "Give it a name.")
  .max(60, "Keep it under 60 characters.");

export const nameSchema = z.object({ name });

export const boardSchema = z.object({ name, shared: z.boolean() });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Add your first name so teammates recognise you.")
    .max(100, "Keep it under 100 characters."),
  last_name: z
    .string()
    .trim()
    .min(1, "Add your last name.")
    .max(100, "Keep it under 100 characters."),
  email,
  password: z.string().min(8, "Use at least 8 characters for your password."),
});

// Parses to TaskFields.
export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the task a title.")
    .max(200, "Keep the title under 200 characters."),
  description: z.string(),
  column: z.custom<ColumnId>((v) => typeof v === "number"),
  due: z.iso.date("Enter a valid date.").optional(),
  label: z
    .string()
    .trim()
    .max(24, "Keep the label under 24 characters.")
    .optional(),
  isEpic: z.boolean().optional(),
  epic: z.custom<ToDoId>((v) => typeof v === "number").optional(),
  subtasks: z.array(
    z.custom<Subtask>(
      (s) => (s as Subtask).title.length <= 200,
      "Keep subtasks under 200 characters.",
    ),
  ),
});

/** First message per top-level field, e.g. `{ title: "Give the task a title." }`. */
export const errorsOf = (error: z.ZodError): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0])] ??= i.message;
  return out;
};
