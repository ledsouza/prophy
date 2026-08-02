---
name: python-standards
description: Consult whenever planning, writing, reviewing, or discussing Python code in this repository (backend/, scripts, tooling). Layers Pythonic idioms — EAFP vs LBYL, pathlib, enum, generators/itertools, dataclass vs Pydantic vs NamedTuple, Protocol vs ABC, lazy logging — on top of the mechanical rules already in .claude/rules/. Also carries a checklist of AI-agent-specific Python anti-patterns (over-commenting, over-engineering, defensive dead code, abstraction bypass, copy-paste duplication, test theater) to self-check against before calling any Python change done. Trigger on: "write a Python function", "review this Python code", "how should I structure this", "is this Pythonic", or any Django/DRF backend implementation task.
---

# Python Standards

This skill is **additive**, not a replacement. Mechanical rules — line length,
naming, docstring format, import grouping, security basics, testing
conventions, `match/case` — already live in `.claude/rules/` and are enforced
by `ruff`. Don't restate them here; read the relevant file directly:

- `.claude/rules/python_format_style.md` — formatting, naming, type hints, docstrings
- `.claude/rules/soft_rules.md` — truthiness, argument count, nesting, OOP/FP balance
- `.claude/rules/structural_pattern_matching.md` — `match/case`
- `.claude/rules/security.md` — safe serialization, crypto, SQL, subprocess
- `.claude/rules/django-testing.md` — pytest conventions

What follows is what those files don't cover: idioms that make code
*genuinely* Pythonic rather than merely rule-compliant, and a self-check
against the specific ways AI-written Python tends to go wrong.

## 1. The actionable third of the Zen of Python

Most of PEP 20 is aphoristic. Four lines are hard constraints for this
codebase, not vibes:

- **Explicit is better than implicit.** No `*args, **kwargs` pass-through
  outside a generic decorator. No hidden side effects in a function whose
  name doesn't say so.
- **Simple is better than complex; there should be one obvious way to do
  it.** When two idiomatic solutions exist, pick the one with less
  machinery (fewer classes, fewer layers) — not the "more extensible" one.
  Default answer to "should this be a class/interface/factory?" is no
  unless there are already ≥2 real implementations.
- **Flat is better than nested.** Reinforces the existing 3-level nesting
  rule in `soft_rules.md`.
- **In the face of ambiguity, refuse the temptation to guess.** Don't
  silently add defensive branches for cases nobody asked about. Ask, or
  leave a single sentence explaining the gap — don't build a config system
  for a hypothetical.

## 2. EAFP vs LBYL — decide per call site

Python's idiom is EAFP (attempt the operation, handle the exception) over
LBYL (pre-check every precondition). But they're not interchangeable:

**EAFP** when the failure path is rare and pre-checking would be racy or
redundant — file I/O, network calls, attribute access on an object whose
shape is uncertain.

**LBYL** when the "failure" is a common, expected outcome, not an
exception — membership tests in hot loops, or when the alternative is
catching an exception broader than the one specific case you care about.

Often the real answer is neither — reach for `dict.get()`, `.setdefault()`,
`.pop(key, default)` before writing either a `try/except KeyError` or an
`if key in dict` check:

```python
# Two lookups, TOCTOU-prone
if "user_id" in payload:
    user_id = payload["user_id"]
else:
    user_id = None

# One lookup, no branch
user_id = payload.get("user_id")
```

## 3. AI-agent Python anti-pattern checklist

Run this checklist before considering any Python change finished. These
are the specific, measured failure modes of AI-generated Python — not
hypothetical style nitpicks:

1. **Over-commenting.** Any comment restating the adjacent line is a bug —
   delete it (see `.claude/rules/comments.md`).
2. **Defensive code for impossible states.** `except Exception:` around
   code that can't fail given the type signature, unused "future
   flexibility" parameters, config knobs for values that never change.
   If the type system already rules out a branch, delete the branch.
3. **Over-engineering.** A factory/strategy/interface for something used
   exactly once. Ask: would a plain function work? Default to yes.
4. **Abstraction bypass.** Reaching for a raw library call when this repo
   already has a wrapper/service for it. Grep for an existing utility
   before writing a new one — this is also mandated project-wide in
   `.claude/rules/swe_django_next.md` under "Code Consistency."
5. **Debugging residue.** No `foo_v2.py`, `foo_fixed.py`, or commented-out
   abandoned attempts left behind. Edit in place or delete.
6. **Copy-paste over reuse.** A near-duplicate block is a signal to
   extract a shared function, not a green light to ship the duplicate.
7. **Test theater.** A test that only asserts a mock was called, rather
   than verifying real behavior, doesn't count — see AAA pattern in
   `.claude/rules/django-testing.md`.

## 4. Idiom quick-reference

**`pathlib.Path` over `os.path`.** String-joining paths doesn't compose;
`Path` does (`/` operator, `.read_text()`, `.glob()`).

**f-strings by default — except in logging calls.** `logger.debug(f"...")`
evaluates the interpolation eagerly every time, even when the level is
disabled. Use lazy `%s` args instead:

```python
# Evaluates expensive_serialize() even if DEBUG is off
logger.debug(f"Payload validated: {expensive_serialize(payload)}")

# Only formats if the record is actually emitted
logger.debug("Payload validated: %s", expensive_serialize(payload))
```

**`enum.StrEnum`/`IntEnum` over magic strings/ints.** For non-Django
constants (Django `choices` already use `TextChoices`), group related
values under an enum instead of bare module-level `UPPER_CASE` strings —
gets validation at construction instead of silent typos. Compare with
dotted names in `match/case`, per `structural_pattern_matching.md`.

**Generators/`itertools` for large or streamed data — not small, fixed
collections.** Swap `[x for x in ...]` for `(x for x in ...)` when the
result is consumed once, especially before an early exit
(`next(gen, None)`). Skip this for anything that's already a short, fixed
list — laziness adds indirection that only pays off at scale.

**`dataclass` vs Pydantic vs `NamedTuple`:**

| Use | When |
|---|---|
| `dataclass` | Internal data, already inside the trust boundary. No validation cost. |
| Pydantic `BaseModel` | Data crossing a trust boundary — but note DRF serializers already own validation at the API boundary in this codebase, so reserve Pydantic for the argument-grouping use case in `soft_rules.md`, not for re-validating what a serializer already validated. |
| `NamedTuple` | Small immutable tuple-like records where unpacking (`x, y = point`) is a feature. |

**`typing.Protocol` vs `abc.ABC`.** Use `ABC` when this codebase owns every
implementing class and inheritance is natural. Use `Protocol` (structural,
no inheritance required) when typing something whose implementer isn't
ours to modify — e.g., "anything with a `.read()` method." Both serve the
DI goal in `soft_rules.md`; `Protocol` is the non-inheritance-based tool
for the same goal when the dependency is external.

**Keyword-only args for boolean flags.** `def resize(image, *, upscale:
bool = False)` — forces `resize(image, upscale=True)` at call sites
instead of an unreadable positional `True`.

**Walrus operator (`:=`)** only where it avoids recomputation (`while
(chunk := file.read(8192)):`), never to cram an assignment into an `if`
purely for brevity — that reintroduces the nesting problem `soft_rules.md`
already guards against.

## 5. Tooling context (what's mechanical vs what needs judgment)

`ruff` already enforces formatting/imports (`E`/`W`/`F`/`I`), modernizes
legacy typing syntax (`UP`), catches real bug patterns like mutable
defaults and bare `except: pass` (`B`), flags needlessly-nested code
(`SIM`), and non-idiomatic comprehensions (`C4`). Don't manually flag
anything in these categories — trust the linter and spend review attention
on what it can't see: the anti-pattern checklist in §3.

Type checking: prefer `pyright` for new strictness work — faster than
`mypy` with a strong strict mode. If a codebase is already on `mypy`,
that's fine; don't churn an existing setup. When tightening typing on
existing code, enable one strict sub-flag at a time
(`disallow_untyped_defs` before `disallow_any_generics`, etc.) rather than
flipping `strict = true` and producing a wall of errors.

Packaging stays on **Poetry** per this repo's explicit convention (`poetry
add`/`poetry remove` — never edit `pyproject.toml` by hand). `uv` is the
current community default for *new* projects, but that's not a reason to
migrate this one — don't suggest it unprompted.

## 6. Pre-flight checklist

Before calling Python work done:

- [ ] Ran the §3 anti-pattern checklist against the diff.
- [ ] No f-strings inside `logger.*()` calls — lazy `%s` args instead.
- [ ] No new class/interface/factory unless ≥2 real implementations exist.
- [ ] Checked for an existing utility/service before writing a new one.
- [ ] Type hints present and using built-in generics / `X | None`
      (`python_format_style.md`).
- [ ] Tests follow AAA and assert real behavior, not mock call counts.
