---
name: typescript-standards
description: Consult whenever planning, writing, reviewing, or discussing TypeScript, React, or Next.js code in this repository (frontend/). Layers idiomatic TypeScript — discriminated unions, satisfies, branded IDs, avoiding enum/any — plus React 19 / Next.js App Router conventions (Server vs Client Component boundaries, hooks discipline, RTK Query patterns specific to this app) on top of the mechanical rules already in .claude/rules/. Also carries a checklist of AI-agent-specific frontend anti-patterns (reflexive "use client", useEffect misuse, premature Context/Redux, cargo-culted memoization) to self-check against before calling any TS/React change done. Trigger on: "write a component", "review this TypeScript", "how should I structure this", "is this idiomatic React", or any Next.js frontend implementation task.
---

# TypeScript / React / Next.js Standards

This skill is **additive**, not a replacement. Mechanical rules — payload
type shapes, Zod validation, logging, testing — already live in
`.claude/rules/` and in `CLAUDE.md` directly. Don't restate them here; read
the relevant source:

- `.claude/rules/typescript_payload_types.md` — `type` vs `interface`, `Partial<Omit<T,"id">>` for PATCH, Zod runtime validation, generic `ApiResponse<T>` wrappers
- `.claude/rules/logging_nextjs.md` — Pino logger, no `console.*`, structured fields
- `.claude/rules/cypress.md` — E2E vs Component Testing split, `data-cy` selectors
- `CLAUDE.md` "Frontend state management" / "Frontend routing" sections — `apiSlice.injectEndpoints()`, `authSlice`/`modalSlice`, parallel routes per role

What follows is what those don't cover: idioms that make code *genuinely*
idiomatic rather than merely rule-compliant, and a self-check against the
specific ways AI-written TypeScript/React tends to go wrong.

## 1. TypeScript idioms

**Discriminated unions over boolean-flag soup.** Model async/UI state as a
tagged union, not independent `isLoading`/`isError`/`hasData` booleans that
can contradict each other:

```ts
// Bad — loading, error, and data can all be true at once
type State = { isLoading: boolean; isError: boolean; data?: User };

// Good — illegal states are unrepresentable
type State =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: User };
```

**`satisfies` over `as`.** `as` silences the checker; `satisfies` validates
against a type without widening the inferred literal type. Use it for
config objects and lookup maps where the narrow inferred shape should
still be usable afterward. Use `as` only when you know something the
compiler structurally cannot — and only after a runtime-narrowing check,
never as a way to make an error disappear.

**Avoid `enum`; prefer `as const` objects or union-of-string-literals.**
TS enums emit runtime JS, don't structurally interoperate with plain
strings from a JSON API, and have surprising numeric reverse-mapping
behavior:

```ts
const Role = {
  PROPHY_MANAGER: "GP",
  UNIT_MANAGER: "GU",
} as const;
type Role = (typeof Role)[keyof typeof Role]; // "GP" | "GU"
```

This maps naturally onto `UserAccount.Role` codes, which the DRF backend
already serializes as plain strings.

**Branded types for entity IDs.** Structural typing means `UnitId` and
`ClientId` are both just `string` and freely interchangeable — a real bug
source when a function/selector accepts both. Brand IDs threaded through
several Redux slices or RTK Query args:

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type ClientId = Brand<string, "ClientId">;
type UnitId = Brand<string, "UnitId">;
```

**Utility types beyond `Partial`.** `Pick<T, K>`/`Omit<T, K>` to narrow a
payload from a canonical entity type instead of hand-duplicating fields;
`Record<K, V>` for lookup maps (role → label, status → color);
`ReturnType<typeof fn>` to derive a type instead of re-declaring it.

**Never `any`; `unknown` + narrowing is the escape hatch.** The same
applies to `as unknown as X` double-casts — they silence the compiler
without adding safety. When a type is genuinely unknown (parsed JSON,
`catch` blocks, third-party callback payloads), type it `unknown` and
narrow with a type guard or a Zod `.parse()`/`.safeParse()`, which this
repo already mandates for API payloads.

**`noUncheckedIndexedAccess` in `tsconfig.json`.** Not part of `strict` —
must be enabled separately. Adds `| undefined` to array index and
index-signature lookups, catching the classic "assumed non-empty
array/object" bug (`users[0].email` when a query legitimately returns
zero rows) at compile time. Worth checking `frontend/tsconfig.json` for
this if type errors around indexed access seem suspiciously absent.

## 2. Next.js App Router conventions

**`"use client"` marks a boundary, not a toggle — push it to the leaf.**
It applies to the entire module and everything it imports, so placing it
on a page or layout because one interactive widget lives inside it drags
a large dependency subtree into the client bundle. Build server-first;
extract only the genuinely interactive piece into its own small client
file; pass server-fetched data down as props.

**Server Actions vs Route Handlers.** A Server Action (`"use server"`)
suits a form/button mutation triggered from within the React tree — it
gets progressive enhancement via native `<form action={...}>`. This app's
mutations go through Django via RTK Query, not Next's own backend, so
Server Actions rarely apply here — reach for one only when a mutation
would otherwise need a bespoke Route Handler purely to proxy to RTK
Query, which RTK Query already does directly from the client.

**`loading.tsx` / `error.tsx` / `not-found.tsx` per route segment.** Given
this app's parallel-route dashboard (`@prophyManager`, `@commercial`,
etc.), each slot can own independent loading/error boundaries instead of
one global spinner — exploit this rather than hand-rolling conditional
loading UI inside a component.

**Next.js 15+ flipped `fetch()` to uncached by default** (a reversal from
14, where fetch was cached unless opted out). Caching is now explicit via
`{ cache: "force-cache" }` or a `revalidate` option. Relevant only if a
Server Component ever calls the backend directly rather than through RTK
Query — flag it if you see code assuming fetch-is-cached-by-default.

**`next/dynamic`** for code-splitting heavy or client-only components
(rich editors, charting libs, anything depending on `window`/`document`
via `{ ssr: false }`).

**`generateMetadata`** over manual `<head>` tags for per-route
`<title>`/OG data — composes with parent segments and supports
async data-dependent metadata (e.g., a client/unit name in the title).

## 3. React hooks discipline

**`useEffect` overuse is the most common AI-generated React anti-pattern.**
Check every effect for two failure modes:

1. **Derived state stored in `useState` and synced via effect** — compute
   it inline during render instead.
2. **Data fetching in `useEffect`** instead of RTK Query. In this codebase,
   `useEffect(() => { fetch(...) }, [])` is almost always a signal an RTK
   Query endpoint should exist instead.

```ts
// Bad
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);

// Good
const fullName = `${first} ${last}`;
```

Legitimate `useEffect` uses remain: synchronizing with a non-React system
(subscriptions, DOM measurement, imperative third-party widget APIs) —
not synchronizing React state with other React state.

**`useMemo`/`useCallback` are for referential stability, not general
speed.** Memoizing is load-bearing only when: (a) the value feeds a
dependency array elsewhere and instability would cause an effect loop, or
(b) the value/callback is passed to a `React.memo`-wrapped child and needs
referential stability to prevent its re-render. Wrapping every inline
function/array "just in case" is premature and a known AI-generated code
smell — check whether either condition actually applies before adding one.

**Custom hooks**: `use`-prefix is required for the Rules of Hooks lint to
apply, not just convention. Keep each hook single-responsibility; extract
when logic is reused across ≥2 components or meaningfully names a concept.

## 4. Redux Toolkit / RTK Query idioms for this app

**Never mirror RTK Query cache data into `useState` or a plain slice.** A
successful query result already lives in the cache under `apiSlice`'s
reducer — read it via the generated hook (`useGetXQuery`) or a selector
built with `apiSlice.endpoints.x.select(args)`. An editable draft before
submit is legitimate local state; the fetched source of truth is not.

**`createSelector` for derived/computed values** (filtering, sorting,
aggregating a cached list) so the computation is memoized against its
inputs instead of recomputed on every render.

**Local `useState` vs a new slice (the `modalSlice` test).** Put UI state
in Redux only if it must be read or mutated from components that aren't
parent/child of each other — exactly `modalSlice`'s existing job (a modal
triggered from nav, rendered at the layout root). If state is only ever
read/written within one component subtree, it's local `useState` — full
stop. Promoting it to Redux "for consistency" is unnecessary indirection.

**`createEntityAdapter`** for any RTK Query response representing a
collection with cross-references (equipment → units → clients) — gives
normalized `{ ids, entities }` state and prebuilt selectors instead of
`.find()` scans scattered through components.

## 5. Component structure / props

**Escalate in this order: props → composition (children) → Context →
Redux.** Don't jump straight to Context or Redux to "fix" 2–3 levels of
prop drilling. Context re-renders *all* consumers on every value change —
it's not a performance tool. Reach for it for low-frequency global values
(theme, current user); reach for Redux/RTK Query when state is shared
across unrelated subtrees or is genuinely server state.

**Never use array index as `key`** in lists that can reorder, filter, or
have items inserted/removed. Use a stable entity ID — already available
for anything backed by a DRF model's `id`.

**Inline object/array/function literals as props** only matter if the
receiving component is `React.memo`-wrapped or the literal feeds a
dependency array. Check that before "fixing" it with a `useMemo` — the
memoization is pure ceremony otherwise.

**Check `app/components/` before building a new compound component or
reaching for a library one** — already a project-wide rule in CLAUDE.md,
worth restating here since it directly targets the AI habit of treating
each prompt as a blank canvas.

**Controlled inputs via React Hook Form's `register`/`Controller`** —
already mandated in this repo. Don't hand-roll `useState` + `onChange`
alongside RHF for the same field.

## 6. AI-agent frontend anti-pattern checklist

Run this checklist before considering any TS/React change finished:

1. **Reflexive `"use client"`** at the top of a large file/page instead of
   at the interactive leaf (§2).
2. **`useEffect` for data fetching or derived state** instead of RTK Query
   / inline computation (§3).
3. **`any` or `as unknown as X`** to silence a type error instead of
   fixing the shape or adding a Zod parse.
4. **Duplicated type/utility definitions** instead of searching
   `app/redux/types/` or `app/components/` first.
5. **Giant one-file components** mixing data fetching, business logic,
   and markup — decompose by responsibility.
6. **Barrel-file (`index.ts` re-export) sprawl** — prefer direct imports
   from the defining file except at genuine public-API boundaries.
7. **Cargo-culted `useCallback`/`useMemo`** on values that never feed a
   `memo` child or a dependency array (§3).
8. **Premature Context/Redux for provably local state** (§4/§5).
9. **`exhaustive-deps` lint disabled** on a `useEffect` instead of fixing
   the dependency array — a stale-closure bug waiting to trigger.

## 7. Accessibility baseline

Semantic HTML first — `<button>` not `<div onClick>`, `<nav>`/`<main>`/
`<section>` over generic `<div>` soup. Every form `<label>` must be
associated to its input (`htmlFor`/`id`, or wrapping) — React Hook Form
doesn't do this automatically. Modals must trap and restore focus (focus
on open, return to trigger on close) and be dismissible via `Escape` —
check whether the existing modal component (driven by `modalSlice`)
already handles this before adding a new one.

## 8. Tooling/ecosystem context

React Compiler (stable since React 19) removes the need for most manual
`useMemo`/`useCallback` where adopted — check if this repo has it enabled
before assuming manual memoization is required. Turbopack is the dev/build
bundler already in use (`npm run dev`). The Next.js 15+ fetch-caching flip
(§2) is the most likely source of "worked before the upgrade" surprises
if any code assumes fetch-is-cached-by-default.

## 9. Pre-flight checklist

Before calling TypeScript/React work done:

- [ ] Ran the §6 anti-pattern checklist against the diff.
- [ ] No `any` / `as unknown as X` — narrowed via type guard or Zod instead.
- [ ] No new Context/Redux slice unless state crosses unrelated subtrees.
- [ ] `"use client"` only on the actual interactive leaf, not a whole page.
- [ ] Checked `app/components/` and `app/redux/types/` before adding new ones.
- [ ] No `useEffect` doing data fetching or synchronizing derivable state.
