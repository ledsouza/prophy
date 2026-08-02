Git: Conventions and Pull Request templates
Release Versioning

<details>
<summary>Semantic Versioning (SemVer)</summary>

All repositories that contain code used in a production environment should follow Semantic Versioning (SemVer) principles for release versioning. While SemVer is designed for software with a "public API", it's also useful for any software where version changes need to be tracked. In the ML field, to ensure reproducibility in production systems, SemVer can be adapted to track changes in model architecture, feature additions and dataset updates or hyperparameter tuning. This makes it particularly valuable for managing any kind of iterations and improvements made to the overall system.

Semantic Versioning (SemVer)
Use the format MAJOR.MINOR.PATCH (e.g., 2.1.3) for version numbers.

MAJOR version (X.y.z): Increment when making incompatible API changes.

Examples:

Changing function signatures

Altering return types or values

Removing or renaming public methods or classes

Requiring a newer, incompatible Python version

Detailed Example:

Current version: 1.2.3

Change: Update to a library version that contains breaking changes

New version: 2.0.0

MINOR version (x.Y.z): Increment when adding functionality in a backward-compatible manner.

Examples:

Adding new features without breaking existing functionality

Introducing new, optional parameters to functions

Expanding with new methods or classes

Detailed Example:

Current version: 1.2.3

Change: Add a new feature or a new endpoint

New version: 1.3.0

PATCH version (x.y.Z): Increment when making backward-compatible bug fixes.

Examples:

Fixing bugs in existing features

Making security updates

Detailed Example:

Current version: 1.2.3

Change: Fix a bug where a function incorrectly handles an edge case

New version: 1.2.4

Release Management Best Practices
Always update the version number before releasing new code.

Use Git tags to mark release points in a repository.

Ensure all breaking changes are clearly communicated in release notes.

</details>

Commit Messages

<details open>
<summary>Conventional Commits</summary>

All commit messages must adhere to the Conventional Commits specification. This format provides a clear and structured way to write commit messages, which helps in automating changelog generation and understanding the project's history.

Format
The commit message should be structured as follows:

<type>[optional scope]: <description>

[optional body]

[optional footer]

type: Must be one of the following:

feat: A new feature for the user.

fix: A bug fix for the user.

docs: Documentation only changes.

style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).

refactor: A code change that neither fixes a bug nor adds a feature.

perf: A code change that improves performance.

test: Adding missing tests or correcting existing tests.

build: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).

ci: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).

chore: Other changes that don't modify src or test files.

revert: Reverts a previous commit.

scope (optional): A noun specifying the section of the codebase the commit changes.

description: A short, imperative-tense description of the change.

Examples
Commit with description and scope:

feat(auth): add user registration endpoint

Commit with multi-paragraph body:

fix: correct handling of user session timeout

The session management logic did not properly invalidate the user's session upon timeout, allowing for potential unauthorized access.

This patch ensures that the session is correctly destroyed and the user is redirected to the login page.

</details>

Pull Request (PR) Template

<details>
<summary>Pull Request Template</summary>

All pull requests should follow the template below to ensure they are easy to review and understand.

Description
A clear and concise description of the changes.

Related Issue
Link to the issue that this PR addresses, if any.

Type of Change
[ ] feat: New feature

[ ] fix: Bug fix

[ ] docs: Documentation update

[ ] refactor: Code refactoring

[ ] test: Adding or updating tests

[ ] chore: Maintenance or other non-code changes

Proposed Commit Message
Instructions for the user:
Please review the following commit message and the related files. If they are correct, you can copy the message and use it to make your commit.

Commit Message:

<type>(<scope>): <description>

Related Files:

path/to/your/file.py

path/to/another/file.py

Checklist
[ ] My code follows the style guidelines of this project.

[ ] I have performed a self-review of my own code.

[ ] I have commented my code, particularly in hard-to-understand areas.

[ ] I have made corresponding changes to the documentation.

[ ] My changes generate no new warnings.

</details>
