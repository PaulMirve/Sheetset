---
name: Sheetset
description: A friendly, colorful kanban workspace where every column, board, label and person carries a hue.
colors:
  ground: "#f4f5fa"
  surface: "#ffffff"
  ink: "#1f2333"
  muted-ink: "#5d6378"
  hairline: "rgba(31, 35, 51, .08)"
  hairline-strong: "rgba(31, 35, 51, .18)"
  primary: "#3563f5"
  on-primary: "#ffffff"
  primary-wash: "rgba(53, 99, 245, .10)"
  alert: "#dc3b40"
  alert-wash: "rgba(220, 59, 64, .10)"
  hue-1-blue: "#3563f5"
  hue-2-amber: "#f08c00"
  hue-3-violet: "#8a4fe8"
  hue-4-green: "#12a67a"
  hue-5-pink: "#e24c8f"
  hue-6-cyan: "#0e9fbf"
  dark-ground: "#13151d"
  dark-rail: "#181b25"
  dark-surface: "#20242f"
  dark-ink: "#eceef5"
  dark-muted-ink: "#a2a8bc"
  dark-hairline: "rgba(255, 255, 255, .07)"
  dark-hairline-strong: "rgba(255, 255, 255, .18)"
  dark-primary: "#6e8dff"
  dark-on-primary: "#0d1020"
  dark-primary-wash: "rgba(110, 141, 255, .16)"
  dark-alert: "#ff6b6f"
  dark-alert-wash: "rgba(255, 107, 111, .14)"
  dark-hue-1-blue: "#6e8dff"
  dark-hue-2-amber: "#ffab3d"
  dark-hue-3-violet: "#b18cff"
  dark-hue-4-green: "#3dd6a3"
  dark-hue-5-pink: "#ff7eb6"
  dark-hue-6-cyan: "#45c9e6"
typography:
  display:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(44px, 5vw, 70px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline-sm:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.45
  body-lg:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.45
  chip:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "\"tnum\""
rounded:
  xs: "8px"
  sm: "9px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  lane: "18px"
  dialog: "20px"
  pill: "999px"
spacing:
  2xs: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lane-gap: "14px"
  lg: "16px"
  xl: "24px"
  page: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "color-mix(in srgb, #3563f5 88%, #000)"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.primary-wash}"
  button-quiet:
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.alert-wash}"
    textColor: "{colors.alert}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  icon-button:
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.sm}"
    size: "30px"
  icon-button-hover:
    backgroundColor: "{colors.primary-wash}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  input-focus:
    backgroundColor: "{colors.surface}"
  chip:
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "25px"
  task-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 12px 11px"
  lane:
    rounded: "{rounded.lane}"
    padding: "0 8px 8px"
    width: "clamp(264px, calc((100vw - 416px) / 4), 340px)"
  hue-tile:
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    size: "30px"
  avatar:
    textColor: "{colors.on-primary}"
    size: "28px"
  menu:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "6px"
  task-dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    width: "min(620px, calc(100vw - 32px))"
  auth-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.dialog}"
    padding: "28px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.xl}"
    padding: "8px 8px 8px 12px"
---

# Design System: Sheetset

## Overview

**Creative North Star: "The Color-Coded Desk"**

Sheetset is a friendly, rounded working surface where color does the first reading. Every column, board, label and person is given one of six hues, so a glance at the board shows stage, ownership and urgency before any text is read. The ground is a soft lavender grey, cards and the sidebar are white, and the hues appear mostly as light tints, with solid color kept for small marks: tiles, dots, avatars and the primary button.

The density suits someone working at a desk for hours: 15.5px body text, 40px controls, cards 8px apart, lanes 14px apart. Corners are generous and get rounder as the container gets bigger. Line icons at a 1.7px stroke sit next to every field label, rail group and action, so the interface reads through small pictures as well as words. Motion is short (160 to 240ms, one shared ease-out curve) and only shows a change of state.

The system avoids both the flat grey Trello clone and decorative gradients inside the workspace. The only atmospheric color field is the pair of soft radial hue glows behind the sign-in screen.

**Key Characteristics:**
- Six-hue palette assigned by rule, never picked per element.
- Tints for areas (7% lanes, 13 to 16% chips, pills and selections); solid hue only for small marks.
- Rounded corners throughout: 8 to 20px containers, full pills for chips and counts.
- Figtree at weights 400 to 800, including in-between weights (550, 650, 750).
- Light and dark themes share one structure; dark swaps in brighter versions of the same hues.

## Colors

A neutral lavender-grey frame carrying one blue action color and six category hues that are applied by rule.

### Primary
- **Action Blue** (primary): the only solid action color. Used for the primary button, the focus ring, the caret, links in the auth switch, the open-card outline and edit underlines. Its 10% wash (primary-wash) is the shared hover fill for secondary buttons, icon buttons and the selected segment.

### Secondary: the six-hue palette
- **Hue 1 Blue** (hue-1-blue): matches Action Blue. First column, brand tile.
- **Hue 2 Amber** (hue-2-amber): second column; also the "due soon" chip and the demo-account notice.
- **Hue 3 Violet** (hue-3-violet): third column; the violet glow on the sign-in screen.
- **Hue 4 Green** (hue-4-green): fourth column; also the done signal: progress-bar fill, landed-card flash, saved check in the modal footer, toast check icon.
- **Hue 5 Pink** (hue-5-pink): fifth column.
- **Hue 6 Cyan** (hue-6-cyan): sixth column; the cyan glow on the sign-in screen.

Each theme defines its own six hues. Dark mode uses brighter versions (dark-hue-1-blue through dark-hue-6-cyan).

### Tertiary
- **Alert Red** (alert): overdue chips, form error text, invalid-input borders, destructive menu items and danger buttons. It is paired with alert-wash for fills. It is a status color and is not part of the hue rotation.

### Neutral
- **Lavender Ground** (ground): the app background, the fill for resting inputs, and the hover fill for rail rows and menu items.
- **White Surface** (surface): cards, the sidebar, menus, the task dialog and the auth card. In dark mode the sidebar (dark-rail) sits one step below the surface (dark-surface).
- **Ink** (ink): primary text. It is also the toast background, which gives the toast inverted colors.
- **Muted Ink** (muted-ink): secondary text, field labels, metadata and icons at rest.
- **Hairline / Hairline Strong** (hairline, hairline-strong): the sidebar border, card-foot divider and menu border; the strong version is used for secondary-button strokes, hovered inputs, the progress-bar track and scrollbar thumbs.

### Named Rules
**The Assigned Hue Rule.** Hue is never chosen by hand. Columns take hue by position (1 to 6, then repeating), boards by a hash of their id, labels by a hash of their lowercased text, and people by their index in the user list. A new colored element must get its hue from one of these rules, set through the `--h` custom property.

**The Tint Ladder Rule.** Areas are tinted, marks are solid. A lane is its hue mixed 7% into the ground. A selected rail row is 13%, a chip 14%, a count pill or soft icon tile 16%, and a lane outline during drag 45%. Chip and count text is 58% hue mixed with ink, so it keeps its color and stays readable.

**The Green Means Done Rule.** Hue 4 Green is also the completion signal (progress, landing flash, saved state). Don't use it for warnings or neutral decoration outside the column rotation.

## Typography

**Display Font:** Figtree (with system-ui, sans-serif)
**Body Font:** Figtree (with system-ui, sans-serif)

**Character:** One friendly geometric sans at every level. Hierarchy comes from weight and tight negative tracking at large sizes, not from a second typeface. Numbers use tabular figures wherever they count or date something.

### Hierarchy
- **Sign-in screen:** no display headline. It is an internal tool, so the screen is only the brand row centered above a 420px auth card, with no marketing copy.
- **Headline** (800, 30px, 1.15, -0.025em): the board title. The auth card heading is a close sibling (750, 26px, -0.02em).
- **Headline Small** (750, 24px, 1.25, -0.015em): the task-dialog title and empty-state headings.
- **Title** (700, 16px): lane names. Card titles sit just below them (650, 15.5px, 1.35). The brand wordmark is 800 at 18px.
- **Body** (400, 15.5px, 1.45): default text. Row names in the rail use 550 and the current row uses 700. Body Large (18px, muted) is the sign-in lede, max 42ch.
- **Label** (600, 14px, muted ink, sentence case): field labels and segmented options, always preceded by a 15px line icon. Rail group heads use 13.5px.
- **Chip** (600, 13.5px, tabular figures): chips, count pills and card metadata.

### Named Rules
**The Weight Not Case Rule.** Labels are sentence case at 600 weight. Hierarchy never uses uppercase or wide letter-spacing.

**The Tabular Count Rule.** Counts, dates, move tallies and progress numbers use tabular figures.

## Layout

The app shell is a two-column grid: a 288px sidebar and a flexible board area. The board header runs 24px from the top and 28px from the sides, with the title block on the left and actions on the right. Lanes sit in a horizontally scrolling row with a 14px gap. Each lane is between 264 and 340px wide and sized so about four fit. When the row overflows, its right edge fades out over 48px. Cards stack 8px apart inside lanes. The task dialog is centered, up to 620 by 740px, with a sticky head and footer around a scrolling body. The sign-in screen is a split: a brand and value column (1.2fr) next to a 360 to 430px card column, 56px apart.

Spacing sticks to a small rhythm (4, 6, 8, 12, 14, 16, 24, 28px). The 2-column field grid in the dialog uses a 16px gap.

**Responsive.** At 980px or narrower, the sign-in screen stacks and the progress bar hides. At 760px or narrower, the sidebar moves above the board (capped at 32vh), the header stacks, page padding drops to 16px, lanes become 84vw wide with scroll snapping, header avatars hide, and dialog fields go to a single column.

## Elevation & Depth

Depth is a hybrid of tone and soft shadow. The ground, the lane tints and the white surfaces create the main layering. Two soft, low-contrast shadows lift the things you can pick up or that float above the board. Shadows respond to state: a card lifts on hover, and during a drag the target is shown with an outline and a dashed slot, not a shadow.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgba(31,35,51,.06), 0 2px 8px rgba(31,35,51,.04)`): task cards and the composer at rest.
- **Lift** (`box-shadow: 0 4px 10px rgba(31,35,51,.08), 0 18px 40px -12px rgba(31,35,51,.22)`): hovered cards, menus, the task dialog, the auth card and the toast.
- **Primary glow** (`box-shadow: 0 1px 2px rgba(0,0,0,.1), 0 4px 12px -4px color-mix(in srgb, var(--blue) 60%, transparent)`): the primary button only.
- **Ring** (`box-shadow: 0 0 0 2px var(--blue)` over Rest or Lift): the open card and the active composer. Input focus uses a 4px primary-wash halo.
- Dark mode uses the same two shadows with deeper black values (see sidecar).

### Named Rules
**The Lift On Touch Rule.** Cards rest on the Rest shadow and move to Lift (plus a 1px rise) only on hover. Floating layers always use Lift.

## Shapes

Corners are soft everywhere, and the radius grows with the size of the container: 8px for small inner pieces, 9px for 30px square controls, 10px for buttons, inputs and rail rows, 12px for cards and notice blocks, 14px for menus, inline panels, dashed empty slots and the toast, 18px for lanes, and 20px for the task dialog and auth card. Chips, count pills and the progress bar are full pills. Dots and avatars are circles. The hue tile's radius is about 30% of its side (30px: 8 to 9px, 44px: 13px, 48px: 14px, 64px: 20px). That rule is the source of the 13px and 16px values in the code; they are not separate scale steps.

Borders are rare. Secondary buttons use an inset 1px hairline instead of a border, and dashed 1.5 to 2px strokes in the lane's hue mark empty lanes and drop slots.

**The Rounder As It Grows Rule.** Pick the radius step by container size. Nothing in the system has square corners.

## Components

### Buttons
Soft, confident, 40px tall.
- **Shape:** gently rounded (rounded.md), 7px gap between icon and text; every button carries a leading line icon when it names an action.
- **Primary:** Action Blue fill with on-primary text and the primary glow. Hover darkens it by mixing in 12% black. Used once per view (New task, Sign in, Add task). The auth submit is 44px tall, the same as an input.
- **Secondary:** white surface with an inset hairline-strong ring; hover fills with primary-wash.
- **Quiet:** transparent, muted ink, 10px side padding; hover turns the text to ink over primary-wash. The lane "Add task" button hovers in its own lane hue instead (12% fill, 70% hue text).
- **Danger:** alert text on alert-wash, no ring.
- **Press:** a 1px downward shift. **Disabled:** 45% opacity.
- **Icon button:** a 30px square (rounded.sm), muted icon, primary-wash on hover.

### Chips
- **Style:** a 25px pill with the hue at 14%, text at 58% hue mixed with ink, and a 14px icon or a 6px solid dot in front.
- **Variants:** label chips (hue from the label text, leading dot, truncate), due chips (neutral by default, amber when due soon, alert red when overdue with "Overdue ·" prefix), and board or column crumbs in the dialog.
- **Count pill:** 24px tall, hue at 16%, bold 13.5px. Rail group counts use a neutral ground pill.

### Cards / Containers
- **Task card:** white surface, rounded.lg, Rest shadow, 10px internal gap. Title, then a two-line clamped description, a chip row, and a footer below a hairline with notes and move-count icons and the assignee avatar on the right. Cursor is grab. When dragged, the card drops to 40% opacity and rotates 1.5°. When open, it gets a blue ring.
- **Lane:** a hue-tinted container (7%) with a sticky head: a 10px solid dot with a 3px 22% halo, the name, a count pill and an icon button. An empty lane shows a dashed hue-tinted slot with an inbox icon.
- **Hue tile:** a solid hue square with a white initial or icon and a 2px inner bottom shade. Soft tiles (sign-in perks, empty states) use a 16% or 14% fill with a hue-colored icon.
- **Avatar:** a solid hue circle with bold white initials and a 2px surface ring. Avatars in a stack overlap by 7px.

### Inputs / Fields
- **Style:** 44px tall, ground fill, transparent 1px border, rounded.md. Every field has a label with a line icon above it, 6px apart. Textareas start at 120px tall.
- **Hover:** the border changes to hairline-strong.
- **Focus:** the fill changes to surface, the border to Action Blue, and a 4px primary-wash halo appears.
- **Error:** an alert border with a 4px alert-wash halo; the error text below is alert at 14.5px.
- **Select:** native, with a custom chevron. **Segmented control:** a 3px-padded surface track; the selected option is primary-wash with blue text.

### Navigation
- **Rail:** a white sidebar with the brand tile and wordmark, Personal and Shared groups (icon label and count pill), and board rows (30px hue tile, name, task count). Hover fills the row with ground. The current board gets a 13% tint of its own hue and bold text. The account button sits at the bottom behind a hairline.
- **Menus:** a white surface with rounded.xl, a hairline border and the Lift shadow. They open with a 180ms pop that scales up from 96%. Items are 9px-rounded rows with muted icons; destructive items use alert red.
- **Mobile:** the rail becomes a top band capped at 32vh, and the email line hides.

### Task Dialog (signature)
A native modal `<dialog>` with rounded.dialog corners and the Lift shadow over a 45% ink-dark backdrop. It rises 10px and scales up from 98% over 240ms. The head holds board and column chips as breadcrumbs and a large editable title. The body holds a two-column field grid. The footer, behind a hairline, shows a green check save state.

### Meeting Import Dialog (signature)
A wide native `<dialog>` (`min(1120px, 100vw - 32px)` × `min(780px, 100vh - 40px)`, 20px radius, Lift) opened from the board header's "From meeting" button. It has three steps:
- **Pick:** meeting rows on the page background (14px radius) with a hue-tinted video tile and a meta line with icons. Hovering a row lifts it.
- **Analyzing:** the notes load on the left while the right pane shows a violet "Reading the notes…" line with a spinning spark icon and shimmer skeletons.
- **Review:** two panes split by a hairline. The notes pane lists timestamp, speaker (in that person's hue) and text, under uppercase section headings. The results pane shows a violet-to-blue tinted AI summary card with green-check decisions, then suggested-task rows. Each row is a label with a native checkbox (`accent-color` blue): selected rows are washed blue with a 1.5px blue ring, and deselected rows fade to 55%. Hovering or focusing a row highlights its source note with an amber wash and ring, and scrolls only the notes pane.

The footer holds the target column select and a primary "Create N tasks" button that is disabled at zero. A select-all checkbox shows an indeterminate state. Below 980px the panes stack; below 760px the footer wraps.

### New Task Dialog
Opened from the header's primary "New task" button. It reuses the task dialog's shell: board and column chips at the top (the column chip updates to match the Column select), then a plain "New task" heading (24px/750) with a close button.
- **Fields:** a required Title (with an inline red error, "Give the task a title."), then Column, Due date, Assignee (shared boards only) and Label, then Notes. Optional labels carry a muted "optional" suffix. Label suggests the board's existing labels.
- **Footer:** a ⌘/Ctrl + Enter keyboard hint (hidden on phones), a quiet Cancel and a primary "Create task".
- **On create:** the dialog closes, the card flashes green and takes focus, and a toast confirms the column.

The per-column "Add task" stays as the quick inline composer.

### Task Source
Tasks created from a meeting carry a violet chip (video icon plus the meeting title, truncated) as the first chip on the card. In the task dialog, a source panel sits above the fields:
- **Panel:** violet tint at 9% with a 1px ring at 22%, 16px radius.
- **Contents:** a violet video tile, the meeting title, a meta line ("Created from this meeting · date · time · platform") and the quoted source line in a white inset (timestamp, speaker in their hue, text).
- **Link:** an outline "Open meeting" button with an external-link icon that opens the meeting in a new tab. On phones the button drops to full width below.

### Subtasks
A checklist in both the task dialog and the New Task dialog, below Notes.
- **Head:** a check-circle label ("Subtasks", with an "optional" suffix in New Task) and a tabular "2 of 4" count on the right that turns green when all are done. A 4px pill progress bar (hairline-strong track, green fill, 300ms width) sits below it.
- **Rows:** 44px input-style rows (ground fill, rounded.md, the same hover and focus states as inputs) with a native checkbox (`accent-color` blue), the title as an inline editable text, and a 30px trash icon button that shows on hover or focus (always on touch) and turns alert red on hover. Checked rows are struck through in muted ink.
- **Add row:** the last row, with a plus icon and "Add a subtask, press Enter". Enter adds and keeps focus there; Enter in a row jumps back to it; Backspace in an empty row deletes it; a row left empty is removed on blur. ⌘/Ctrl + Enter still submits the dialog.
- **Card:** the foot shows a check-circle meta with "done/total" (e.g. 2/3), green when complete.

### Drag and Land (signature)
While a card is dragged, the target lane gets an inset 2px outline at 45% of its hue, and a dashed slot in the lane's hue (10% fill, card radius) marks the drop point. The origin collapses as a fading ghost. On drop, the landed card flashes a green ring over 600ms and the progress bar animates to its new width over 300ms.

### Toast
Inverted colors (ink background, ground text), rounded.xl, a green check and an undo button with a translucent fill. It is centered 24px from the bottom and rises in over 220ms.

## Do's and Don'ts

### Do:
- **Do** assign every new colored element a hue through `--h` and one of the four assignment rules (position, id hash, text hash, user index).
- **Do** tint areas (7% lanes, 13 to 16% chips, pills and selections) and keep solid hue for tiles, dots, avatars and the primary button.
- **Do** put a 1.7px line icon (17px by default; 14 to 15px in chips, labels and card metadata) beside every field label, group head and named action.
- **Do** choose the radius by container size from the rounded scale, and use full pills for chips and counts.
- **Do** keep motion between 160 and 240ms (300 to 600ms only for progress and the landing flash) on the shared ease-out `cubic-bezier(.16, 1, .3, 1)`, and only for state changes. Respect reduced motion.
- **Do** use tabular figures for counts and dates.

### Don't:
- **Don't** pick hues by hand or add a seventh hue. Status colors (alert red, the green done signal, amber for due soon) are the only meanings layered on top of the rotation.
- **Don't** add gradients inside the workspace. The soft radial hue glows stay on the sign-in screen only.
- **Don't** use uppercase or tracked-out labels. Use weight and a line icon instead.
- **Don't** fill large surfaces with solid hue; a solid lane or card breaks the tint ladder.
- **Don't** use square corners or hard, offset shadows. Depth comes from the Rest and Lift shadows only.
