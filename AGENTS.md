# What is considered a breaking change

Customers run LAMS in their CI pipelines, where any `error`-level finding causes a non-zero exit code and fails builds. Therefore:

- **Any net new error finding for an unmodified LookML project is considered a breaking change.**
- **Any `lookml-parser` major bump or LookML representation change is a breaking change** for custom rules (even if all built-in rules pass) and requires a `major` version bump.
- New error-level rules or newly surfaced error-level messages (including new parser validation checks being passed through) must be **opt-in** via `manifest.lkml` unless updating the major version.
- Only error conditions that were already surfaced by default, such as due to an effect of our implementation, may use `defaultEnabled: true`.

# Test Assets

- Avoid writing temporary files via `fs` inside tests. Use actual fixture files in dedicated subdirectories (e.g., `test-project/`) checked into the repo.


# Rule implementation
- Despite the "custom" naming within the codebase, all new built-in rules should be able to use the checkCustomRule (/lib/custom-rule/custom-rule.js) interface. It is more succinct and is sufficiently flexible to handle all rules. 
- When feasible, prefer implementing rules using LIYAD (a Lisp-based DSL)
    - This is so that customers wanting to implement their own custom rules have a good foundation of examples and built-in functions available
    - Broadly re-usable JS functions and methods can be added to LIYAD. See `lib/custom-rule/custom-rule-parser.js`. Functions should only be added to LIYAD only be added when safe for the untrusted code to call.
    - For an example, see `/usr/local/google/home/fabble/projects/look-at-me-sideways/rules/k4/index.js`

# Documentation

- Before pushing code changes that contain fixes or features, check whether the readme and release notes (`docs/release-notes.md`) have been updated
- The release notes are only for brief, consumer-facing information. It should not include implementation details, refactors, dev tooling, etc.
