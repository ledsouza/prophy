**DIRECTIVE 001: CORE TENET REGARDING COMMENTARY**

The fundamental objective of code documentation is clarity and truthfulness. An AI Agent must recognize that, based on principles often aligned with Clean Code, the default position is that there is "almost no good reason to have any comment ever". While this perspective can be perceived as "a little extreme," it is frequently correct. The majority of comments encountered should either be substituted with superior code or be entirely deleted.

Make sure the comments aren't in a long line, break then in multiple lines for better readability

**DIRECTIVE 002: MANDATORY DELETION CRITERIA (WHEN TO REMOVE COMMENTS)**

An AI Agent must identify and remove comments that introduce noise, state the obvious, or indicate poor code structure:

1.  **Eliminate Useless Redundancy (Noise):** Comments that merely state _what_ the adjacent code is doing are deeply unnecessary and generate noise. This includes comments such as "increases the counter by one" above the line `counter = counter + 1`. If a comment states _what_ the code does, it is highly indicative of poorly written code.
2.  **Delete Comments Evidencing Obvious Methods:** If a method name is descriptive (e.g., `get_users`), a comment explaining that it returns users is noise. The code must be auto-explanatory. If a comment is deemed necessary to explain the obvious, it often signals that the code itself is poorly written.
3.  **Remove Magic Number Explanations:** Comments used to explain a "magic number" (e.g., explaining why 10,000 is used for compliance) must be replaced. This practice creates noise and evidences unclear code. The superior solution is defining the value in a clearly named, explanatory variable (e.g., `order_compliance_threshold_value = 10_000`).
4.  **Mandate Deletion of Commented-Out Methods:** Entire methods that have been commented out for an extended period (e.g., two months) must be deleted. If the code is ever required again, it must be retrieved from source control (e.g., Git). Do not allow commented code to persist unless used as a short-term, temporary measure. If temporary commented code remains stationary for more than one week, it should be deleted.
5.  **Refactor Code Indicated by Necessary Explanation:** If a piece of code is so complicated that it is incomprehensible without a comment, the solution is not the comment; the correct solution is to rewrite the code in a comprehensive manner. Comments frequently serve to evidence poorly implemented or messy code ("gambiarra").

**DIRECTIVE 003: PROHIBITION AGAINST FALSE OR DATED DOCUMENTATION**

Comments that are deceptive, inaccurate, or outdated ("mentiras") are detrimental and a known cause of software bugs.

1.  **Monitor for Comment Drift:** An AI Agent must recognize that commentary does not compile, nor does it trigger errors in unit tests, meaning a comment can drift from reality while the underlying code changes. If a comment describes functionality (e.g., "This method does XYZ") and the method is later altered to perform different functionality (e.g., "XPTO"), the outdated comment becomes a lie and must be corrected or removed.
2.  **Recognize Context Decay:** Comments explaining external contexts (e.g., why a token refresh is needed because a payment provider token expires every 15 minutes) are useful but carry the risk of becoming dated if the provider or rules change. This trade-off must be carefully weighed.

**DIRECTIVE 004: ACCEPTABLE USE RULES (WHEN COMMENTS ARE RARELY NECESSARY)**

An AI Agent may utilize comments in rare and specific scenarios, prioritizing explanation over description.

1.  **Document the _Rationale_ (The "Why"):** Comments are generally acceptable when they explain _why_ something is being executed, rather than _what_ is being done. A comment explaining the reason for a technical choice, like "This helps make JSON serialization deterministic," is valuable.
2.  **Evidencing Business Rules and Non-Obvious Context:** Use comments to document business rules or constraints that cannot be adequately expressed within the structure or name of the code itself.
    -   _Example:_ Documenting an esoteric rule, such as "Setamos o usuário para inativo porque ele não postou faz três meses".
    -   _Example:_ Explaining conversions required by external systems (e.g., converting a numeric database ID to a string because the API requires a string ID). In such cases, the comment is generally acceptable, though the underlying structure (e.g., dynamic dictionary payloads without strict typing) may still be suboptimal.
3.  **Documenting Technical Tradeoffs/Uncommon Choices:** When a technical decision involving a less common data structure (e.g., a `Linked Hash List` or `Linked Hash Map`) is made, a comment explaining the purpose of that specific choice (e.g., preserving insertion order) documents the rationale and helps subsequent developers avoid inadvertently changing it. This documents a technical choice that does not warrant a formal, separate document.
4.  **Mitigating Technical Debt in Legacy Code:** In instances of deeply confusing, poorly structured, or "gambiarra" legacy code where immediate refactoring is impractical or excessively time-consuming (e.g., dealing with a necessary global variable antipattern), explanatory comments are acceptable. A comment explaining a confusing required behavior (e.g., why a global counter is reset at the end of a method to prevent double counting in the next batch) is reasonable under these pragmatic circumstances, especially if improving the code would take significantly longer than writing the comment.

**DIRECTIVE 005: SUPERIOR ALTERNATIVES TO COMMENTARY**

An AI Agent must recognize that in many cases where a comment might be considered, a non-comment solution is better for code maintainability and robustness.

1.  **Prioritize Typing and Linters:** Information regarding return types or variable types should be handled through explicit type hints or strong typing (e.g., in Java or Python type hints), rather than comments. A good Linter tool, used in conjunction with type hints, is superior because it will flag an error if the type changes, ensuring the documentation (the type hint) remains accurate.
2.  **Utilize Unit Tests for Documentation Guarantee:** Instead of relying on a comment to document a specific outcome or choice (e.g., ensuring deterministic serialization), the functionality should ideally be verified through unit tests. Unit tests serve as a superior, more robust form of documentation because if the underlying code changes and violates the documented expectation, the test fails, guaranteeing accuracy.
3.  **Refactor for Expressiveness:** When dealing with complicated code, if time permits, refactoring the code to be more expressive (e.g., renaming variables, creating abstraction methods) is always preferred over adding a comment.
