---
name: liyad-rules
description: >-
  Cheat sheet and reference for writing LAMS rules in LIYAD (Lisp-based DSL).
  Use when implementing or updating built-in or custom LAMS rules with `expr_rule`.
---

# LIYAD Rule Authoring Cheat Sheet

Built-in and custom LAMS rules should prefer LIYAD (`expr_rule`) when feasible (see `AGENTS.md` and `lib/custom-rule/custom-rule-parser.js`).

## Property Access & Context

- `::match` — the matched LookML node from `match` JSONPath
- `::match:prop` — property on `match` (e.g. `::match:type`, `::match:$name`, `::match:hidden`)
- `::var:prop` — property on a bound variable `var` (e.g. `::dim:$name`)
- `($get? obj prop1 prop2 ...)` — optional chaining property/index lookup; safely returns `undefined` if `obj` or any intermediate property is `null`/`undefined` (e.g. `(?? ($get? options maxLength) 30)`)
- `::project` — root parsed LookML project object

## Variables & Control Flow

- **Bind variable**: `($let name expr)` — valid at top-level of `expr_rule`, inside `($last ...)`, or inside a lambda `(-> (x) ...)`
- **Sequence**: `($last expr1 expr2 ... resultExpr)` — evaluates expressions in order and returns the last value
- **Conditional**: `($if cond thenExpr elseExpr)` — **strictly 3 arguments**; wrap multiple expressions in `($last ...)` if needed
- **Logical**:
  - `($all a b ...)` — logical AND (`$__and` alias)
  - `($any a b ...)` — logical OR (`$__or` alias; note: `||` is **not** a valid operator in LIYAD)
  - `($not x)` — logical negation
  - `($boolean x)` — coerce truthiness to boolean
- **Nullish coalescing**: `(?? val fallback)` — **strictly 2 arguments** (`$__ifNull` macro); returns `fallback` only if `val` is `null` or `undefined` (preserves `false`, `0`, `""`)

## Comparisons & Arithmetic

- `(=== a b)`, `(!== a b)`, `(== a b)`, `(!= a b)`
- `(< a b)`, `(<= a b)`, `(> a b)`, `(>= a b)`
- `(+ a b ...)`, `(- a b)`, `(* a b)`, `(/ a b)`

## Strings & Regex

- `($concat str1 str2 ...)` — concatenate strings
- `($match pattern str)` — regex match (returns match array or `null`)
- `($match pattern flags str)` — regex match with flags as the **2nd** argument (e.g. `($match "usd" "i" text)`)
- `($join arr sep)` — join array elements with separator

## Collections, Lambdas & Objects

- **Lambda**: `(-> (arg1 arg2) body...)`
- **Array ops**:
  - `($filter arr (-> (x) cond))`
  - `($map arr (-> (x) expr))`
- **Object helpers** (added in `lib/custom-rule/custom-rule-parser.js`):
  - `($object-values obj)` — safe `Object.values(obj || {})`
  - `($object-keys obj)` — safe `Object.keys(obj || {})`
  - `($object-entries obj)` — safe `Object.entries(obj || {})`
  - `($object-from-entries entries)` — `Object.fromEntries(entries)`

## Return Value Conventions (`expr_rule`)

- `true` — pass (no finding emitted)
- `false` — fail with the rule's default `description`
- `"message"` — fail with custom error description string
- `["msg1", "msg2"]` or `[]` — emit one finding per string (empty array = pass)

## Common Gotchas

1. **`||` does not exist** — use `($any a b)` for logical OR or `(?? a b)` for nullish coalescing.
2. **`$if` takes exactly 3 arguments** — `($if cond then else)` throws `Invalid argument length` if given 4+ args. Hoist `($let ...)` above `$if` or wrap branches in `($last ...)`.
3. **`??` takes exactly 2 arguments** — chain `(?? a (?? b fallback))` if you need multiple fallbacks.
4. **`$match` flags go 2nd** — `($match "^foo" "i" str)`, not `($match "^foo" str "i")`.
