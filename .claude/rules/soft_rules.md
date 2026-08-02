# Soft rules and recommendations

## Explicit is (usually) better than implicit

Avoid `from my_module import *`. Always import by explicit name.

Use explicit truthiness checks:

```python
# Bad
if x:
    ...

# Good
if x is not None:
    ...
```

Same applies to empty collections and strings. Avoid `*args`/`**kwargs` unless writing generic decorators — explicit signatures make IDEs and readers understand the API.

## Avoid using global variables

Mutable global state breaks encapsulation, makes concurrency unsafe, and makes code hard to test. Never use the `global` keyword. Pass state via arguments or class instances.

Also avoid mutable default arguments — use `None` as the default and check inside the function.

## Don't use too many arguments in functions and methods

Aim for ≤ 3 arguments (Uncle Bob's Clean Code). More than that usually means a function is doing too much or needs a parameter object.

Use Pydantic `BaseModel` to group related arguments:

```python
class CreateUserPayload(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None

def create_user(payload: CreateUserPayload) -> User:
    ...
```

## Avoid explicit or implicit recursion

Python's default recursion limit is 1000 and tail-call optimization is absent. Prefer iterative solutions (`for`/`while` + stack/queue) for anything that could grow deep.

If you must recurse:
- Define a clear base case
- Ensure each step moves toward it
- Use memoization if there's repeated subproblem overlap

Reserve recursion for cases where the iterative equivalent is genuinely harder to read (e.g., tree backtracking with bounded depth).

## Avoid writing too many lines of code in a single function or method

Keep functions under ~30 lines. If longer, decompose into named helpers — each with a single responsibility.

Use the **Strategy Pattern** for multiple conditional paths instead of long `if/elif` chains:

```python
SHIPPING_STRATEGIES = {
    "standard": StandardShipping(),
    "express": ExpressShipping(),
    "overnight": OvernightShipping(),
}

def calculate_shipping(order, method, country):
    return SHIPPING_STRATEGIES[method].calculate(order, country)
```

## Avoid using too many nested loops, ifs, and try-except blocks

Follow the 3-level nesting rule. Flatten with:

**Early returns:**
```python
def process_user(user):
    if user is None:
        return False
    if not user.is_active:
        return False
    if not user.has_permission("edit"):
        return False
    # Do something
    return True
```

**Comprehensions and generators** for filtering/transforming collections.

**Context managers** to replace nested try/finally blocks.

**Custom exceptions** to let each except clause be specific.

**Chain of Responsibility** or **State Machine** classes for complex conditional flows.

## Avoid using catch-all exceptions

`except:` and bare `except Exception:` hide bugs and prevent `KeyboardInterrupt`/`SystemExit` from propagating.

Always catch specific exceptions:

```python
try:
    with open("file.txt") as f:
        data = f.read()
except FileNotFoundError:
    log_error("File not found")
except PermissionError:
    log_error("Permission denied")
```

If you must catch broadly, log and re-raise:

```python
except Exception:
    logger.exception("Unexpected error in process_data")
    raise
```

Use `else` for the success path and `finally` for cleanup.

## Functional programming: when to use and when to avoid

**Prefer:**
- List/set/dict comprehensions over `map`/`filter` with lambdas
- Generator expressions for large or lazy sequences
- Pure functions (same input → same output, no side effects)
- Immutable structures (`tuple`, `frozenset`, `namedtuple`) when data won't change

**Avoid:**
- Complex multi-line lambdas — extract a named function instead
- Deeply nested comprehensions — split into named generators
- `reduce` for simple aggregations — `sum`, `max`, `min` are clearer
- Recursion (see above)

## Object-Oriented Programming: when to use and when to avoid

**Do:**
- Single-responsibility classes with clear interfaces
- Composition over inheritance for "has-a" relationships
- `@property` instead of Java-style `get_*`/`set_*` methods
- Abstract base classes (`abc.ABC`) to define interfaces and enable DI
- `dataclass` or Pydantic `BaseModel` for plain data containers
- Call `super().__init__()` whenever overriding `__init__`

**Avoid:**
- Deep inheritance hierarchies (> 2 levels)
- Multiple inheritance except for simple, stateless mixins
- Metaclasses unless you have a very specific, justified need
- Magic methods beyond `__init__`, `__repr__`, and operators when semantically natural

**Dependency Injection:** pass dependencies as constructor arguments rather than importing concrete classes inside methods. This keeps code testable and decoupled.

## String handling for multi-language support

Don't hardcode user-facing strings in logic. Centralise them in language modules (`.py` constants or `.yaml` files) and load by language code. Use `lru_cache` to avoid re-reading files on each request.

For Django projects prefer the built-in `gettext`/`django.utils.translation` machinery over custom solutions.
