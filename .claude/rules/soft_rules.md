---
paths:
  - "backend/**/*.py"
---

# Soft rules and recommendations

`ruff` already rejects `global`, more than three positional arguments, mutable default arguments, `import *` misuse, non-idiomatic comprehensions and bare `except:`. What follows is what it cannot see.

## Explicit is better than implicit

Import by explicit name. Use explicit truthiness checks: `if x is not None:`, `if len(items) == 0:`, not `if x:`. Avoid `*args` / `**kwargs` outside generic decorators.

## Group related arguments

When a function needs more than three inputs, group them in a Pydantic `BaseModel` or a dataclass instead of adding parameters:

```python
class CreateUserPayload(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None


def create_user(payload: CreateUserPayload) -> User:
    ...
```

## Avoid recursion

The default recursion limit is 1000 and there is no tail-call optimization. Prefer an explicit stack or queue. If recursion is clearly more readable (bounded tree walks), define the base case first and memoize overlapping subproblems.

## Keep functions short and flat

Aim for under 30 lines and at most three levels of nesting. Flatten with early returns, comprehensions and generators, context managers, and specific custom exceptions. Replace long `if/elif` chains on one value with `match/case` or a strategy mapping:

```python
SHIPPING_STRATEGIES = {
    "standard": StandardShipping(),
    "express": ExpressShipping(),
}


def calculate_shipping(order, method, country):
    return SHIPPING_STRATEGIES[method].calculate(order, country)
```

## Catch specific exceptions

`except Exception:` hides bugs. Catch the specific class. If a broad catch is unavoidable, log with `logger.exception()` and re-raise. Use `else` for the success path and `finally` for cleanup.

## Functional style

Prefer comprehensions and generator expressions over `map`/`filter` with lambdas, `sum`/`max`/`min` over `reduce`, pure functions and immutable containers where data does not change. Extract a named function instead of a multi-line lambda or a nested comprehension.

## Object-oriented style

Single-responsibility classes, composition over inheritance, `@property` over getters and setters, `abc.ABC` or `typing.Protocol` to define an interface, `dataclass` or `BaseModel` for plain data. Call `super().__init__()` when overriding `__init__`. Avoid hierarchies deeper than two levels, multiple inheritance beyond stateless mixins, metaclasses, and magic methods beyond `__init__`, `__repr__` and natural operators. Pass dependencies in through constructor arguments rather than importing concrete classes inside methods.

## User-facing strings

Do not hardcode user-facing text in logic. Use Django's `gettext` / `django.utils.translation` machinery.
