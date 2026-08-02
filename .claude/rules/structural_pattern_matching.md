# Structural Pattern Matching (Python `match/case`)

Use `match/case` (PEP 634) instead of chains of `if/elif` or `isinstance` checks when dispatching on the structure or type of a value.

## When to use

- Dispatching on the type of an object or the shape of a sequence/mapping.
- Replacing a long `if/elif/elif` chain that checks the same variable.
- Parsing structured data (e.g., command strings, API action dicts).

## Key rules

- Use **or patterns** (`|`) to combine alternatives that share the same handler.
- Use **guard clauses** (`case ... if condition:`) to add boolean constraints.
- Use `case _:` as the final wildcard — always last, never bound.
- Prefer **dotted names** for constants (e.g., `Status.ACTIVE`) — bare names are capture variables, not value comparisons.
- Use **as patterns** to capture a matched sub-pattern: `case ("go", direction) as cmd:`.

## Example

```python
match command.split():
    case ["quit"]:
        quit()
    case ["go", ("north" | "south" | "east" | "west") as direction]:
        move(direction)
    case ["drop", *objects]:
        for obj in objects:
            drop(obj)
    case _:
        print(f"Unknown command: {command!r}")
```

## Mapping patterns

Extra keys in the subject are ignored (unlike sequence patterns). Use `**rest` to capture them.

```python
match action:
    case {"type": "text", "body": str(msg)}:
        display(msg)
    case {"type": "sleep", "duration": float(n)}:
        wait(n)
    case _:
        log.warning("Unrecognised action", action=action)
```
