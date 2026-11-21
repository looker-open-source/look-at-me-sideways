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
- `($get? obj prop1 prop2 ...)` — optional chaining macro for **static** property names; turns symbol args into literal keys and safely returns `undefined` if `obj` or any intermediate property is `null`/`undefined` (e.g. `(?? ($get? options maxLength) 30)`)
- `($get-in obj key1 key2 ...)` — optional chaining function for **dynamic** variable keys or indices (e.g. `($get-in view fieldType fieldName)`)
- `($is-hidden path)` / `($is-hidden path "dimension" ::dim:$name)` — returns whether the field or explore at `path` is hidden, accounting for view-level `fields_hidden_by_default`
- `::project` — root parsed LookML project object
- `::before_all` — object mapping each `before_all: block_name { ... }` block's exact name to its pre-computed value (e.g. `::before_all:index_aliases` or `($get-in before_all "index_aliases" ...)`)

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

- **Lambda**: `(-> (arg1 arg2) body...)` — **does not** capture outer `$let` variables or outer parameters
- **Closure**: `(|-> (arg1 arg2) use (outer1 outer2) body...)` — required whenever a callback references variables from an enclosing scope
- **Array ops**:
  - `($filter arr (-> (x) cond))`
  - `($map arr (-> (x) expr))`
  - `($is-array val)` — `Array.isArray(val)` (use instead of `$is-list`, which checks LIYAD AST lists)
  - `($includes arr val)` — `Array.isArray(arr) && arr.includes(val)`
  - `($flatten arr)` — flattens one level (`arr.flat()`)
  - `($slice start [end] arr)` — note: target array/string is the **last** argument
- **Object helpers** (added in `lib/custom-rule/custom-rule-parser.js`):
  - `($object-values obj)` — safe `Object.values(obj || {})`
  - `($object-keys obj)` — safe `Object.keys(obj || {})`
  - `($object-entries obj)` — safe `Object.entries(obj || {})`
  - `($object-from-entries entries)` — `Object.fromEntries(entries)`
  - `($set-prop obj key val)` — safely sets `obj[key] = val` (rejects `__proto__`, `constructor`, `prototype`) and returns `obj`

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
5. **`->` does not capture outer `$let` variables** — use `(|-> (x) use (outerVar) ...)` for closures.
6. **`$get?` vs `$get-in`** — `$get?` is a macro that turns symbol args into literal keys (`($get? obj foo)` = `obj.foo`); use `($get-in obj keyVar)` when keys are variables.
7. **`$all` / `$any` are functions, not short-circuiting** — all arguments are evaluated eagerly, and passing a bare JS array directly to `$all` can cause LIYAD to evaluate it as a form; use `$if` or `$get?`/`$get-in` for guards.
8. **`$concat` is for strings only** — use `$flatten` or `$push` for arrays.
9. **`$slice` target is last** — `($slice 1 arr)`, not `($slice arr 1)`.
