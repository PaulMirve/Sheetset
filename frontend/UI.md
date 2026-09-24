# UI guidelines

How screens are built in this app. The visual design itself (colors, type scale, spacing, component looks) lives in [`wireframes/DESIGN.md`](../wireframes/DESIGN.md); this file is about **how the code uses it**.

The short version:

1. **All text goes through `Typography`.**
2. **All controls are design-system components.** No raw `<input>`, `<select>`, `<textarea>` or `<button>` in screens.
3. **Missing something? Build a component, not a one-off.** Every new component ships with Storybook stories.

---

## 1. Text: always `Typography`

Screens never set font size, weight, letter-spacing or line-height themselves. Pick a level from the type scale:

| Variant | Use for | Look |
| --- | --- | --- |
| `headline` | Board title, sign-in card heading | 800 · 30px |
| `headline-sm` | Dialog titles, empty-state headings | 750 · 24px |
| `title` | Lane names, card and list-item titles, section headings | 700 · 16px |
| `body` (default) | Running text, descriptions, secondary lines | 400 · 15.5px |
| `body-lg` | Lede text (sign-in) | 400 · 18px |
| `label` | Field labels, small headings, links in sentences | 600 · 14px |
| `chip` | Counts, timestamps, metadata (tabular figures) | 600 · 13.5px |
| `brand` | The product wordmark only | 800 · 18px |

```tsx
// ✅
<Typography as="h2" variant="headline-sm">New task</Typography>
<Typography as="p" color="muted">Sign in to pick up where you left off.</Typography>
<Typography as="time" variant="chip" color="muted">{note.t}</Typography>

// ❌ raw element + ad-hoc type classes
<h2 className="font-[750] text-[24px] tracking-[-0.015em]">New task</h2>
<p className="text-muted text-[14px]">…</p>
```

- **`as`** keeps the right HTML element for accessibility: headings stay `h1`–`h4`, paragraphs `p`, and so on. It defaults to `div`.
- **`color`** takes a theme token (`ink`, `muted`, `primary`, `alert`, `on-primary`). Use `color="inherit"` only when a hue tints the text, e.g. `className="text-[color-mix(in_srgb,var(--h)_60%,var(--color-ink))]"`.
- **`className`** is for layout (flex, gap, margin, truncate), never for type styles.
- **A level that doesn't fit** means the type scale needs changing, not the screen. Add or adjust the variant in `Typography.tsx` and document it in DESIGN.md.
- **A form control that needs a type level but can't be `Typography`** (e.g. a textarea styled as a heading) uses the exported `typography({ variant })` class builder. See `EditableTitle`.
- **Allowed exceptions:** the design-system components themselves (they define the scale), and a glyph sized to fit its box, such as the letter in a board tile.

## 2. Controls: use the design-system components

| Need | Component |
| --- | --- |
| Any button (primary, secondary, quiet, danger, icon-only) | `Button` |
| Labelled text, email, password, number or date field | `Input` |
| Labelled dropdown | `Select` |
| Labelled multi-line field | `TextArea` |
| Checkbox, with optional label and "some selected" state | `Checkbox` |
| On/off switch for an immediate setting | `Toggle` |
| Text edited in place inside a row that draws the field | `InlineInput` |
| Dialog title you can edit in place | `EditableTitle` |
| Chip / pill (label, due date, metadata) | `Tag` |
| Line icon | `Icon` (add new SVGs to `src/assets/icons/` and `IconName.ts`) |
| Dialog | `Modal` |

- **No raw form elements in screens.** `Input`, `Select` and `TextArea` already bring the label, icon, "optional" hint, error message and the ARIA wiring (`aria-invalid`, `aria-describedby`) through `Field`.
- **Every control has an accessible name:** a `label`, or an `aria-label` when there's no visible one (icon buttons, `InlineInput`, a bare `Checkbox`).
- **Colors come from tokens** (`bg-surface`, `text-muted`, `border-line`, `bg-primary-wash`…) or a hue through `--h` (`hue(n)`, `hashHue(s)` in `src/hue.ts`). Never hex values in screens.
- **Known gap:** whole-row navigation buttons (sidebar board rows, the meeting picker list) are still raw `<button>`s. If you touch one, consider a list-row component.

## 3. Creating a new component

Create one when:

- the same UI pattern appears in **two or more places**, or
- it's a **control or text element** the table above doesn't cover.

A one-off layout specific to one screen can stay in that screen, as long as it's built from the components above.

How:

1. **Location:** `src/components/Name.tsx`, PascalCase, default export. Add it to the table in section 2.
2. **Built from the system:** `Typography` for text, other components for controls, tokens for color. Match the spec in DESIGN.md. If the design doesn't cover it, add it there.
3. **Native first:** wrap the native element (`<input type="checkbox">`, `<dialog>`, `<select>`) instead of re-implementing it.
4. **Forward the rest:** spread remaining props onto the native element and merge `className`, so callers can add `aria-*`, handlers and layout classes.
5. **Documented:** a JSDoc comment on the component and on each of its own props. Storybook turns these into the docs page.

## 4. Storybook stories are required

Every **design-system component** (the ones in the tables above, plus `Typography`) has a `Name.stories.tsx` next to it. So does every new one you add:

- `tags: ["autodocs"]` on the meta, which generates the docs page.
- One story per meaningful state: default, filled, error, disabled, sizes and variants.
- A `play` test for anything with behavior (typing, toggling, keyboard, validation), using `expect` and `fn` from `storybook/test`:

```tsx
export const Default: Story = {
  args: { "aria-label": "Done" },
  play: async ({ canvas, userEvent }) => {
    const box = canvas.getByRole("checkbox", { name: "Done" });
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};
```

`Field` is exempt: it's the internal wrapper behind `Input`, `Select` and `TextArea`, and their stories cover it. **Feature components** (`DroppableColumn`, `ToDoCard`, `Subtasks`, `TaskModal`, `MeetingModal`) are screen parts with app data. They don't have stories yet, but a story with mock data is welcome, and it becomes required once one is reused elsewhere.

Run them with:

```sh
yarn storybook                           # browse and read the docs at localhost:6006
npx vitest run --project storybook       # run every story and play test
npx playwright install chromium          # once, before the first test run
```

## Checklist before you commit

- [ ] No `<h1>`–`<h6>`, `<p>`, `<small>`, `<b>` or `<label>` with type classes in screens. Use `Typography`.
- [ ] No `text-[…px]`, `font-[…]`, `font-bold`, `tracking-[…]` or `leading-[…]` outside the design-system components.
- [ ] No raw `<input>`, `<select>`, `<textarea>` or `<button>` in screens.
- [ ] New components have JSDoc, a story file with `autodocs`, and `play` tests for their behavior.
- [ ] `yarn typecheck`, `npx eslint src` and `npx vitest run --project storybook` pass.
