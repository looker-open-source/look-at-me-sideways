## What is considered a breaking change

Customers run LAMS in their CI pipelines, where any `error`-level finding causes a non-zero exit code and fails builds. Therefore:

- **Any net new error finding for an unmodified LookML project is considered a breaking change.**
- New error-level rules or newly surfaced error-level messages (including new parser validation checks being passed through) must be **opt-in** via `manifest.lkml` unless updating the major version.
- Only error conditions that were already surfaced by default, such as due to an effect of our implementation, may use `defaultEnabled: true`.

## Test Assets

- Avoid writing temporary files via `fs` inside tests. Use actual fixture files in dedicated subdirectories (e.g., `test-project/`) checked into the repo.
