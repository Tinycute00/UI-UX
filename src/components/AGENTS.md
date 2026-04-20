# AGENTS.md — `src/components/`

Custom component library. **Not shadcn/ui** — inspired by it but handwritten against the 50–70yo design constraints. No Radix primitives wrapper layer; Radix is a dep but used ad-hoc.

## Layout

```
a11y/        → A11yProvider + AccessibilityBar (font-scale 1/1.15/1.3, high-contrast)
charts/      → SCurve (Recharts) — only chart component, read RPC output
forms/       → SignaturePad (react-signature-canvas wrapper)
layout/      → Header, Sidebar (desktop), MobileTabBar (5 items), MobileDrawer,
               BackButton, OfflineBanner, AccessibilityBar, StubPage
ui/          → Badge, Button, Card, Checkbox, Field (primitive kit)
icons.tsx    → All SVG icons (flat file, not a folder)
providers.tsx→ QueryClientProvider + A11yProvider composite root
```

## Rules

1. **Icons go in `icons.tsx`, not new files.** Keep them inline SVG, no `<Image>`, no emoji. Export as named React components.
2. **`ui/` is the only primitive layer.** Don't introduce a second one (no shadcn add, no Radix wrapper). If you need a new primitive, add it here with the existing `class-variance-authority` pattern.
3. **Touch targets ≥56px mobile / ≥60px for `.btn-mobile`.** Enforced via Tailwind classes in `tailwind.config.ts`. Don't override with smaller sizes for "compact" variants.
4. **Focus outlines are 3px** (see `globals.css`). Never set `outline: none` without replacement.
5. **Font-scale respects CSS vars** (`--font-scale` 1 / 1.15 / 1.3). Use `rem`/`em`, not hard `px`, for user-facing text.
6. **`StubPage` is for unimplemented modules only.** When replacing, delete the `<StubPage>` call entirely — don't wrap it.
7. **`MobileTabBar` shows exactly 5 items.** Driven by `navigation.ts` filter. Don't add a 6th.

## Wiring

- `providers.tsx` is mounted in `src/app/layout.tsx` (root) — do NOT re-mount inside `(app)/layout.tsx`.
- `OfflineBanner` listens to `navigator.onLine`; safe in RSC because it's `"use client"`.
- `Sidebar`/`MobileTabBar` both import `NAV` from `@/lib/navigation` — changing routes there auto-updates nav.

## Anti-patterns

- Adding a new `charts/*` component without checking if it should be an RPC + `SCurve` variant.
- Importing Radix primitives directly into `src/app/**` pages — wrap in `ui/` first.
- Using Tailwind arbitrary font sizes (`text-[14px]`) on body copy — breaks the 18px minimum.
