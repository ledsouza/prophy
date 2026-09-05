---
paths:
  - "backend/**/*.py"
---

# Python formatting and style

Formatting, import order, naming, line length (79 for code, 72 for docstrings and comments), built-in generics, `X | None`, Google-style docstrings, trailing commas and `global` are all enforced by `ruff` from `backend/pyproject.toml`; CI runs `ruff check .` and `ruff format --check .`. Do not restate or hand-check them.

## Type hints

- Every function and most methods carry type hints.
- Constants may be annotated (`MAX_ITERATIONS: int = 100`); local variables should not be.

## Module shadowing

Never name a module after a standard-library or installed third-party module (`json.py`, `random.py`, `numpy.py`). Python imports the local file instead of the library and fails in confusing ways.

```python
# File: json.py
import json

json.dumps({"key": "value"})  # AttributeError: imports this file
```

Acceptable only for an internal module that is always imported through its package path (`from utils import json`) and documented as such. Prefer a distinct name (`my_json_utils.py`).
