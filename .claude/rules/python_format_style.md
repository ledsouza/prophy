# Code Formatting and Style

## Maximum Line Length for code and docstrings

<details open>
<summary></summary>

In Python, the maximum line length for coding is 79 characters. For docstrings and comments the maximum line length is 72 characters. This is to ensure that the code is readable on a variety of screen sizes and devices. If a line is too long, it can be broken up into multiple lines using parentheses and other methods. This is a guideline that comes from the PEP 8 style guide. A way to display and instantly check the line length is to use the ruler option in the text editor. For VSCode, the ruler can be enabled by going to the settings and searching for "ruler" and editing the JSON as follows:

```json
{
    "editor.rulers": [
        {
            "column": 79,
            "color": "#696969"
        },
        {
            "column": 72,
            "color": "#404040"
        }
    ]
}
```

The recommended way to automatically enforce the line length is to use the `ruff` code formatter. In VSCode, the `ruff` formatter can be enabled by installing the Python extension and setting the formatter to `ruff` in the settings. Note that you need to change the maximum line length in the settings to 79 characters. Using this `devcontainer` setup, the `ruff` formatter is already installed and configured, so each time you save a Python file, the formatter will automatically format the code to adhere to the PEP 8 style guide. Also note that `ruff` doesn't enforce the limit for docstrings and comments, so you need to manually check the length of those lines.

</details>

## Indentation and whitespaces

<details open>
<summary></summary>

The recommended indentation is 4 spaces, as recommended in the PEP 8 style guide, ehich can be automatically enforced by the `ruff` code formatter in the same way as the last point, but this is where some of the guidelines will differ from PEP 8. For example, there are multiple ways to break lines while being compliant with PEP 8, but `ruff` will choose the one that is the most readable and consistent.

For example, the following are valid ways to break a line in Python:

```python
foo = long_function_name(var_one, var_two,
                         var_three, var_four)

def long_function_name(
        var_one, var_two, var_three,
        var_four):
    print(var_one)

foo = long_function_name(
    var_one, var_two,
    var_three, var_four)

my_list = [
    1, 2, 3,
    4, 5, 6,
    ]
result = some_function_that_takes_arguments(
    'a', 'b', 'c',
    'd', 'e', 'f',
    )

income = (gross_wages
          + taxable_interest
          + (dividends - qualified_dividends)
          - ira_deduction
          - student_loan_interest)

```

While `ruff` will enforce the following:

```python
def long_function_name(
        var_one,
        var_two,
        var_three,
        var_four,
    ):
    print(var_one)

foo = long_function_name(
        var_one,
        var_two,
        var_three,
        var_four,
)

my_list = [
    1,
    2,
    3,
    4,
    5,
    6,
]
result = some_function_that_takes_arguments(
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
)

income = (
    gross_wages
    + taxable_interest
    + (dividends - qualified_dividends)
    - ira_deduction
    - student_loan_interest
)

```

For whitespaces, the PEP 8 style guide recommends the following:

-   Surround top-level function and class definitions with two blank lines.
-   Method definitions inside a class are surrounded by a single blank line.
-   Extra blank lines may be used to separate groups of related functions.

When using whitespace in expressions, the PEP 8 style guide recommends avoiding the following usages:

-   Immediately inside parentheses, brackets or braces.
-   Immediately before a comma, semicolon, or colon.
-   Immediately before the open parenthesis that starts the argument list of a function call.
-   Immediately before the open parenthesis that starts an indexing or slicing.
-   More than one space around an assignment (or other) operator to align it with another.
-   Avoid trailing whitespace anywhere.

For example, the following are bad ways to use whitespace in Python:

```python
spam( ham[ 1 ], { eggs: 2 } )
bar = (0, )
if x == 4 : print(x , y) ; x , y = y , x
ham[lower + offset:upper + offset]
ham[1: 9], ham[1 :9], ham[1:9 :3]
ham[lower : : step]
ham[ : upper]
spam (1)
dct ['key'] = lst [index]
x             = 1
y             = 2
long_variable = 3
```

While the following are good ways to use whitespace in Python:

```python
spam(ham[1], {eggs: 2})
foo = (0,)
if x == 4:
    print(x, y)
    x, y = y, x
ham[1:9], ham[1:9:3], ham[:9:3], ham[1::3], ham[1:9:]
ham[lower:upper], ham[lower:upper:], ham[lower::step]
ham[lower+offset : upper+offset]
ham[: upper_fn(x) : step_fn(x)], ham[:: step_fn(x)]
ham[lower + offset : upper + offset]
spam(1)
dct['key'] = lst[index]
x = 1
y = 2
long_variable = 3
```

For operations, `ruff` will enforce the following (against PEP 8):

```python
i = i + 1
submitted += 1
x = x * 2 - 1
hypot2 = x * x + y * y
c = (a + b) * (a - b)
```

Instead of:

```python
i = i + 1
submitted += 1
x = x*2 - 1
hypot2 = x*x + y*y
c = (a+b) * (a-b)
```

</details>

## Imports

<details open>
<summary></summary>

Imports should be on separate lines and grouped in the following order:

1. Standard library imports.
2. Related third party imports.
3. Local application/library specific imports.

You should put a blank line between each group of imports, although it's not mandatory or enforced by `ruff`. For example:

```python
import os
import sys
from datetime import datetime

import numpy as np
import pandas as pd
from matplotlib import pyplot as plt

import my_module
from my_package import MyClass
```

</details>

## Naming Conventions

<details open>
<summary></summary>

The following are ways to name things in Python:

-   single lower case character. Ex: `x`.
-   single uppercase character. Ex: `X`.
-   multiple lower case words separated by underscores (snake case). Ex: `my_variable`.
-   multiple uppercase words separated by underscores. Ex: `MY_VARIABLE`.
-   a single (or double) underscore. Ex: `_`.
-   a single (or double) underscore followed by something. Ex: `_X`, `_my_variable`.
-   camel case. Ex: `myVariable`.
-   Pascal case. Ex: `MyVariable`.
-   snake case. Ex: `my_variable`.
-   Pascal case with underscores. Ex: `My_Variable`.

The following are the naming conventions for Python code:

-   Variables, functions, methods and modules should be in `snake_case`.
-   Constants should be in `UPPER_CASE`.
-   Classes and custom Exceptions should be in `PascalCase`.
-   Protected instance attributes should be in `_single_leading_underscore`.
-   Private instance attributes should be in `__double_leading_underscore`.
-   Magic methods should be in `__double_underscore__`.
-   Avoid using single character names except for some cases in counters or iterators (even then, we recommend a name that is more descriptive).
-   Variables that are meant to be temporary or insignificant should be in `_`.
-   the other cases should be avoided.
</details>

## Trailing commas

<details open>
<summary></summary>

Trailing commas are recommended when defining tuples, lists, and dictionaries line by line. This is to make it easier to add or remove elements from the end of the sequence. For example:

```python
var1 = [0, 1, 3]
var2 = [
    0,
    1,
    4,
    6,
]
```

This is automatically enforced by `ruff`.

</details>

## Type hints

<details open>
<summary></summary>

Type hints are highly recommended for all functions and most methods. This is to make the code more readable, maintainable and allow IDEs to provide better autocompletion and suggestions. For example:

```python
def process_row(
    index_row: tuple,
    answer_inputs: class_module.MyInput,
    task: registry_module.TaskRegistry,
    check_params: bool = False,
) -> List[dict] | None:
    pass
```

Type hints can also be used when defining constants, for example:

```python
MAX_ITERATIONS: int = 100
AWS_S3_BUCKET: str = os.environ.get("AWS_S3_BUCKET", "my_local_bucket")
AWS_S3_REGION: str | None = os.environ.get("AWS_S3_REGION", None)
AWS_S3_KEY: str | None = os.environ.get("AWS_S3_KEY", None)
```

It's neither necessary nor recommended to use type hints for variables, as the code can get too verbose (and the type can be inferred by the IDE). Not only that: the type of a variable can change during the execution of the code (although this is not recommended).

</details>

## Comments and Docstrings

<details open>
<summary></summary>

Comments in line should be avoided. Instead, use docstrings to describe the purpose of functions, methods, classes, and modules. For that, we recommend using the Google style docstrings. For example:

```python
def process_row(
    index_row: tuple,
    answer_inputs: class_module.MyInput,
    task: registry_module.TaskRegistry,
    check_params: bool = False,
) -> List[dict] | None:
    """Process a row of data and return a list of dictionaries.

    Args:
        index_row (tuple): the row of data to process.
        answer_inputs (class_module.MyInput): the input data.
        task (registry_module.TaskRegistry): the task to process.
        check_params (bool, optional): a boolean key to check for more
            parameters in the database in case of True. Defaults to
            False.

    Returns:
        List[dict] | None: a list of dictionaries with the processed
            data. In case of an error in the connection, returns None.

    Raises:
        ValueError: in case of an error while checking the parameters to
            be returned.
    """
    pass
```

Using the extension `njpwerner.autodocstring` in VSCode (already in this DevContainer), you can automatically generate a skeleton for the docstring by typing `"""` and pressing `Enter`. This extension will also automatically generate the docstring for the function, method, class, or module when you press `Enter` after defining it. For the previous example, the extension would generate the following skeleton:

```python
def process_row(
    index_row: tuple,
    answer_inputs: class_module.MyInput,
    task: registry_module.TaskRegistry,
    check_params: bool = False,
) -> List[dict] | None:
    """_summary_

    Args:
        index_row (tuple): _description_
        answer_inputs (class_module.MyInput): _description_
        task (registry_module.TaskRegistry): _description_
        check_params (bool, optional): _description_. Defaults to False.

    Returns:
        List[dict] | None: _description_
    """
```

You can use the GitHub Copilot extension to fill in the blanks in the docstring, as this is a good way to ensure that the docstrings are consistent and complete.

Overall, type hinting and this style of docstring will make the code more readable and maintainable. Not only that: it will make the code possible to analyze statically with tools and for IDEs to provide better autocompletion and suggestions, also showing definitions and references when hovering over a variable or function.

</details>

## Module Shadowing

<details open>
<summary></summary>

### What is Module Shadowing?

Module shadowing occurs when a file in your project has the same name as a standard library module or an installed third-party module. This can lead to unexpected behavior, as Python may import your file instead of the intended module, causing runtime errors or incorrect functionality.

### When to Avoid Naming Files the Same as a Module

-   **Standard Library Modules**: Avoid naming your files the same as Python's standard library modules (e.g., `os.py`, `json.py`, `random.py`). Doing so can cause Python to import your file instead of the standard library module, leading to errors.
-   **Third-Party Modules**: Similarly, avoid naming files the same as third-party modules installed in your environment (e.g., `numpy.py`, `pandas.py`).

### When It May Be Acceptable

-   **Internal Modules**: If your project has a specific internal module structure and the file is not intended to be imported outside of its context, naming it the same as a module may be acceptable. However, this should be done with caution and clear documentation.

### Examples

#### Problematic Example

```python
# File: json.py
import json

data = json.dumps({"key": "value"})  # This will raise an AttributeError because it imports the current file.
```

#### Correct Example

```python
# File: my_json_utils.py
import json

data = json.dumps({"key": "value"})  # Correctly imports the standard library's json module.
```

#### Internal Module Example

```python
# File: my_project/utils/json.py
def custom_json_function():
  pass

# File: my_project/main.py
from utils import json

json.custom_json_function()  # This is acceptable if the module is internal and well-documented.
```

### Best Practices

-   Use descriptive and unique filenames to avoid conflicts.
-   Test imports in a clean environment to ensure the correct modules are being imported.

</details>
