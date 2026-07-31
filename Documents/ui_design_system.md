# OpenSign — Premium UI Refresh Guide

**Goal:** Keep every page's layout, structure, and functionality exactly as it is today. Change *only* the finish — color depth, spacing, typography, shadows, and small interaction details — so the app reads as premium and modern, without becoming harder to use or requiring a redesign of any screen.

This guide is grounded in the app's **actual current setup** (`apps/OpenSign/tailwind.config.js`): Tailwind + daisyUI with an `op-` class prefix, two themes already defined (`opensigncss` = light, `opensigndark` = dark). Nothing here proposes ripping that out — it's a refinement of the same token system already in place.

---

## 1. Design Philosophy

- **Same skeleton, better finish.** Sidebar stays on the left, same nav items, same page layouts, same buttons in the same places. A returning user should never feel lost.
- **Premium = restraint, not decoration.** More whitespace, one confident accent color, consistent shadows and rounding — not more colors, more gradients, or more visual noise.
- **Easy to use stays non-negotiable.** Every change below is judged by: does this make the *next* action clearer, or just prettier? If a change doesn't pass that test, don't make it.
- **This system applies to the Super Admin Console too.** The Super Admin Console (separate app, separate domain) should look like it belongs to the same product family as OpenSign itself — same tokens, same component rules from this document — not a second, unrelated design language. It is not styled independently.

---

## 1a. Avoiding the "Generic AI-Generated" Look

This is worth calling out explicitly, since it's the easiest way to accidentally undo "premium." A few very recognizable patterns have become shorthand for "this was thrown together fast," and this refresh deliberately avoids every one of them:

| Avoid (reads as generic/AI-generated) | Do instead |
|---|---|
| Bright, saturated blue-to-purple gradients on buttons/headers (`#3B82F6 → #8B5CF6` and similar) | Flat, single, **desaturated** colors — no gradients on buttons, cards, or backgrounds at all |
| The default Tailwind "blue-500 / indigo-600" as the primary color — the single most overused color in template-generated UI | A deeper, muted, slightly desaturated tone (see the revised palette below) — same *family* as OpenSign's existing navy, just refined, not the generic SaaS blue |
| Glassmorphism / frosted-glass cards, heavy `backdrop-blur` everywhere | Use blur only in one place — the modal overlay — nowhere else |
| Oversized rounded corners on everything (pill-shaped buttons, `rounded-full` cards) | Moderate, consistent radius (see Section 2 — `0.75rem`, not `1.9rem` pill shapes) |
| Emoji or decorative icon clusters used as visual filler | Icons only where they convey meaning (nav items, status), never decorative |
| Drop shadows that glow in the accent color (colored shadows) | Neutral, black-based shadows only, at low opacity (Section 5) |
| Overly perfect, generic stock-illustration style graphics | Keep OpenSign's existing illustrations as-is — don't introduce new generic "SaaS people at laptops" art |
| Every heading in bold, every button a gradient, everything competing for attention | One clear visual hierarchy per screen — most things should be quiet, only 1–2 things per screen should stand out |

**The single fastest test:** if a screenshot of the result could be mistaken for a random AI-generated SaaS landing page template, it's wrong. It should look like it was made by people who've used this exact product for years and know precisely what needs emphasis and what doesn't.

---

## 2. Color System (refining the existing theme tokens)

Keep the same daisyUI theme *keys* (`primary`, `secondary`, `accent`, `neutral`, `base-100/200/300`) — only refine the actual values for more depth and a more premium feel.

**Note on the colors below:** deliberately *not* Tailwind's default `blue-500`/`blue-600` (`#3B82F6`/`#2563EB`) — that exact pair is the single most overused "default AI/template" color in the industry today, and using it is what makes a lot of generated UIs look interchangeable. Everything below is desaturated and muted on purpose — same blue *family* as OpenSign's existing brand navy, refined rather than replaced.

### Light theme (`opensigncss`) — refined

```js
opensigncss: {
  primary: "#33475B",            // deep, muted slate-navy — desaturated, not a bright/generic blue
  "primary-content": "#FFFFFF",

  secondary: "#F1F5F9",           // soft cool-gray instead of a dark slate — lighter sidebar, less heavy
  "secondary-content": "#1E293B",

  accent: "#5C7A99",              // a lighter, still-muted steel-blue from the same family, for hover/highlights only
  "accent-content": "#FFFFFF",

  neutral: "#E2E8F0",
  "neutral-content": "#334155",

  "base-100": "#FFFFFF",          // page background
  "base-200": "#F8FAFC",          // card/panel background — subtle, not gray-on-gray
  "base-300": "#F1F5F9",          // hover/pressed surfaces

  "base-content": "#0F172A",      // near-black text, not pure black (softer on the eyes)

  info: "#5C8AA0",                // muted teal-slate, not a bright cyan/blue
  success: "#4B7A5A",             // muted forest green, not a bright neon green
  warning: "#9C7A3C",             // muted bronze/gold, not a bright amber
  error: "#A0453F",               // muted brick-red, not a bright alarm red

  "--rounded-btn": "0.75rem",     // slightly less pill-shaped than the current 1.9rem — reads more modern/professional
  "--tab-radius": "0.5rem",
}
```

### Dark theme (`opensigndark`) — refined

```js
opensigndark: {
  primary: "#5C7A99",             // muted steel-blue — legible on dark, still not a bright generic blue
  "primary-content": "#0B0F14",

  secondary: "#161B22",           // GitHub-dark-style sidebar, richer than flat slate
  "secondary-content": "#C9D1D9",

  accent: "#7C97AF",              // a touch lighter for hover states, same muted family
  "accent-content": "#0B0F14",

  neutral: "#21262D",
  "neutral-content": "#C9D1D9",

  "base-100": "#0D1117",          // deep, slightly blue-black rather than pure #121212 — feels less flat
  "base-200": "#161B22",
  "base-300": "#1E242B",

  "base-content": "#E6EDF3",      // soft off-white, not stark white — easier on the eyes for long sessions

  info: "#6B93A8",
  success: "#5A9468",
  warning: "#B99456",
  error: "#B65E58",

  "--rounded-btn": "0.75rem",
  "--tab-radius": "0.5rem",
}
```

**Why this reads as more "premium" (and not AI-generated):** no bright/saturated primaries anywhere — every color, including the semantic ones (success/warning/error), is deliberately muted rather than the loud defaults most templates ship with; fewer, more deliberate colors overall; less-rounded corners (0.75rem vs. 1.9rem) which reads as more professional/enterprise rather than playful.

---

## 3. Typography

Keep the existing font stack (system UI fonts — fast-loading, no new dependency needed). Apply one consistent scale everywhere instead of ad-hoc sizes per page:

| Use | Size | Weight |
|---|---|---|
| Page title (e.g. "OpenSign™ Drive") | `text-xl` (20px) | 600 |
| Section heading (e.g. card titles) | `text-base` (16px) | 600 |
| Body text | `text-sm` (14px) | 400 |
| Secondary/muted text (timestamps, helper text) | `text-xs` (12px) | 400, `text-base-content/60` |
| Button label | `text-sm` (14px) | 500 |

**One rule that matters most for "premium":** never mix more than 2 font weights on one screen (e.g. 400 and 600 — skip 500/700 elsewhere on the same view). Visual consistency reads as intentional design, not accumulated patches.

---

## 4. Spacing & Layout

- Increase internal padding on cards/panels from the current tight spacing to a consistent `p-5` / `p-6` — cramped content is the #1 thing that makes an app feel "cheap."
- Consistent gaps between elements: `gap-3` for tightly related items (icon + label), `gap-6` between distinct sections.
- Sidebar and top bar: keep exact current widths/heights (don't change the skeleton) — just tighten up internal alignment (icons and labels vertically centered, consistent left-padding for every nav item).

---

## 5. Elevation & Shadows (currently minimal — this is a big lever for "premium")

Add a small, consistent shadow scale, used consistently instead of ad-hoc borders everywhere:

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);          /* resting cards */
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);          /* dropdowns, popovers */
--shadow-lg: 0 12px 32px rgba(0,0,0,0.12);         /* modals */
```

- **Cards/panels:** `shadow-sm` + a very light 1px border (`base-300`), not a heavy border alone — this is the single change that most reads as "premium SaaS product" vs. "plain admin panel."
- **Modals:** `shadow-lg`, slightly larger corner radius than buttons (`1rem`), a subtle backdrop blur behind them (`backdrop-blur-sm` on the overlay) instead of a flat dark overlay.
- **Buttons:** no shadow at rest; a very subtle `shadow-sm` only on hover for primary buttons — implies responsiveness without looking gimmicky.

---

## 6. Component Guidelines

### Buttons (`op-btn`)
- Primary action: solid `primary` background, white text, `rounded-btn` (0.75rem per above).
- Secondary action: outline style — 1px `base-300` border, transparent background, hover fills `base-200`.
- Destructive action (delete, suspend): use `error` color, but **only** as an outline until hovered/focused — a page full of solid red buttons feels alarming, not premium.
- Disabled state: lower opacity (`op-btn-disabled` equivalent) rather than a totally different gray — keeps the button's shape recognizable.

### Inputs (`op-input`)
- 1px border in `base-300` at rest, `primary` border + subtle `primary/10` ring on focus (not just a color change — the ring is what reads as "modern").
- Consistent height across all inputs on a form (`h-10`) — mismatched input heights on the same form is a common "unpolished" tell.

### Cards / Panels
- `base-200` background, `shadow-sm`, `rounded-lg` (larger radius than buttons — cards should feel like "containers," buttons like "actions").

### Tables (Drive, Documents, Contacts lists)
- Row hover: subtle `base-200` background — makes scanning long lists feel responsive.
- Header row: `text-xs`, `font-semibold`, muted color (`base-content/60`), not full-strength text — this alone makes a table look far more refined.
- Consistent row height (don't let one row with a long name stretch taller than its neighbors — truncate with `...` instead).

### Sidebar
- Active nav item: `primary/10` background tint + `primary` text (not a hard solid-color block) — softer, more premium than the current solid highlight.
- Icons: consistent stroke width across the whole sidebar (mixing filled and outline icons is a common inconsistency to fix).

### Modals (e.g. "Add a new folder")
- Centered, `shadow-lg`, generous internal padding (`p-6`), a clear visual separation between the title, the content, and the action buttons (a thin divider or spacing gap — not butted right up against each other, which is the current pattern we've seen in screenshots today).

---

## 7. Motion (small, not flashy)

- Buttons: `transition-colors duration-150` on hover — instant enough to feel responsive, not sluggish.
- Modals: fade + slight scale-in (`scale-95` → `scale-100`, 150–200ms) instead of appearing instantly — this single detail is disproportionately effective at making an app feel "designed."
- Sidebar nav change: no animation needed — snappy is better than animated for primary navigation.

---

## 8. Applying This to Specific Screens We've Already Seen Today

- **Login page:** keep the exact same two-column layout (form left, illustration right). Refine: increase spacing around the form, apply the new input/button styles, soften the illustration's background blob color to match the refined palette.
- **Dashboard:** keep the same 2x2 stat-card grid. Refine: apply `shadow-sm` + lighter borders to the stat cards, use the muted-header-text rule from the Tables section for "Recent signature requests" column headers.
- **OpenSign™ Drive:** keep the same folder/file grid. Refine: add a hover shadow lift on each folder/file icon, apply the new modal styling to "Add a new folder."
- **Super Admin Console** (Overview, Logs, Companies, Audit Log): built from this exact same system, not a separate one. Its sidebar/top bar use the same component rules as OpenSign's own (Section 6); its stat cards, tables, modals, and buttons follow the same rules as above. The only intentional difference from OpenSign itself: it never shows the playful/illustrated login artwork — a plainer, more purely "operational tool" login screen (form only, no illustration) is more appropriate for an internal control panel than for the customer-facing product.

---

## 9. Implementation Checklist

1. Update the two theme blocks in `apps/OpenSign/tailwind.config.js` with the refined color values above (Section 2).
2. Add the shadow scale (Section 5) as Tailwind theme extensions or CSS variables.
3. Sweep existing pages for inconsistent spacing/padding and standardize per Section 4 — no layout changes, just consistent values.
4. Standardize the button/input/card component styles (Section 6) — since this app is not TypeScript and doesn't use a single shared component library everywhere, this may mean touching several individual page files rather than one central component; prioritize the highest-traffic screens first (Login, Dashboard, Drive, Document viewer).
5. Add the small motion details (Section 7) last, once the static visual refresh is confirmed to look right.

**Nothing in this checklist changes what any button does, where any page lives, or how any flow works — only how it looks and feels.**

---

*OpenSign · Premium UI Refresh Guide · v1.0 · July 2026*
