
## 8. Nuxt web UI and UX system

### 8.1 Visual source of truth

Before broad UI implementation:

1. define the real product subject, audience, context, and page job
2. create or review `design-system/MASTER.md`
3. approve the shadcn-vue theme preset with green primary
4. define light and dark token pairs
5. approve typography, density, layouts, and one signature product-specific
   design idea
6. document page-specific overrides only when a page truly differs

Do not overwrite an existing approved master design system during routine page
work. Read it first. Page files override only named master decisions.

### 8.2 shadcn-vue theme

- Initialize shadcn-vue through its current CLI and Nuxt integration.
- Generate the approved preset through the official shadcn-vue theme/preset
  workflow.
- Use a green `primary`/`primary-foreground` pair.
- Keep neutral surface, card, popover, border, input, muted, accent,
  destructive, ring, and sidebar tokens semantic.
- Define tokens once under `:root` and `.dark` in the global CSS entry.
- Use `@nuxtjs/color-mode` with `classSuffix: ''`.
- Default theme preference should be `system`; provide Light, Dark, and System
  choices and persist the selection.
- Test both themes independently. Do not assume dark mode is correct because the
  token names are semantic.
- Do not add manual `dark:` color overrides in product templates.
- Do not change component colors, typography, shadows, border radius, or
  internal spacing page by page.

### 8.3 Compact component policy

Compact means high information clarity with efficient space, not tiny controls.
This section is the canonical contract for `UI-DENSITY-001`; it is mandatory
for every active web surface.

- Prefer default or built-in small variants where they preserve readability.
- Use one density consistently within the same product surface.
- Keep body text at least 16px on mobile.
- Keep touch targets at least 44×44 CSS pixels; a compact visual icon may have a
  larger hit area.
- Keep related actions close and unrelated actions clearly separated.
- Use natural-width desktop actions by default.
- Use full-width mobile actions only when they improve reach and clarity.
- Do not globally edit shadcn-vue internals to make every component shorter.

`UI-VISUAL-001` owns the theme, shadcn-vue, Tailwind, token, icon, and image
rules in Sections 8.1, 8.2, 8.4, 8.5, and 8.6. `UI-DENSITY-001` and
`UI-VISUAL-001` must both be blocking rules in a generated web project's gate
manifest; a design review checklist without executable selection and evidence
is not sufficient.

### 8.4 Tailwind is layout-only

In application pages and feature components, Tailwind classes are allowed for:

- display and visibility
- flexbox and grid
- gap
- margin and padding
- width, height, min/max size, and aspect ratio
- alignment, order, and placement
- position and inset
- overflow and scrolling
- container/layout breakpoints
- responsive variants
- accessibility layout utilities such as `sr-only`

Prefer `gap-*` over `space-x-*` and `space-y-*`.

Application pages and feature components must not use Tailwind to invent a
second visual system through:

- raw or arbitrary colors
- typography styling
- borders and rings
- radii
- shadows
- gradients, blur, filters, or glow
- page-specific animations
- manual dark-mode colors
- arbitrary visual values used as one-off patches

Important boundary:

- shadcn-vue component source uses Tailwind internally; that source is managed by
  shadcn-vue and is not constrained to layout-only utilities.
- product code consuming those components is constrained to layout-only classes.
- theme values and exceptional global rules live in the one global CSS entry.
- if a missing visual token is genuinely required, add a semantic light/dark CSS
  variable and document it in `docs/design-tokens.md`.

### 8.5 CSS decision ladder

Before adding CSS:

1. Is there a default shadcn-vue component?
2. Is there a built-in component variant or size?
3. Can the page be fixed by better structure or semantics?
4. Can Tailwind express the remaining layout?
5. Is the remaining need a reusable semantic token or behavior?

Only step 5 justifies custom CSS. Custom CSS must be small, shared when
repeatable, documented, and placed in the canonical global file or the narrowest
appropriate component.

### 8.6 shadcn-vue component rules

- shadcn-vue is the exclusive application component system from Section 3.8.
  Do not mix a second component library into selected pages or wrap another
  library to make it look like shadcn-vue.
- Check the current component docs and registry before creating custom markup.
- Add only components the project uses.
- Review CLI-added source and imports.
- Preview upstream updates with CLI dry-run/diff behavior; do not overwrite local
  changes blindly.
- Use full `Card` composition: header, title, description, content, and footer
  when those regions exist.
- Use the default `Item` composition for repeated row-like content when its
  semantics fit; use `Card` only for a real grouped content region. Do not
  reproduce either component with styled generic wrappers.
- Use `SelectGroup`, menu groups, and `CommandGroup` for labelled or semantically
  related item sets. A single unlabelled set may use direct items when the
  current component documentation supports that composition.
- Put `TabsTrigger` inside `TabsList`.
- Give Dialog, Sheet, and Drawer an accessible title.
- Give Avatar a fallback.
- Use `Alert` for callouts, `Empty` for empty states, `Skeleton` for loading,
  `Badge` for status, `Separator` for separation, and `vue-sonner` for toasts.
- Use the default `Sidebar` composition for application navigation,
  `SidebarTrigger` for its responsive trigger, `ScrollArea` for the bounded
  main application scroll region, and `Pagination` for every result list.
  Do not replace these with page-specific custom controls.
- Compose a loading button with `Spinner`, `disabled`, and stable copy.
- Use the project's configured icon library. Icons in buttons use the component
  API conventions and do not receive arbitrary sizing classes.
- Do not build styled clickable `div` elements when a semantic component exists.
