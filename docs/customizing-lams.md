# Customizing LAMS

LAMS comes pre-bundled with a number of rules that reflect our opinionated best practices. However, sometimes these rules will not be right for your organization, or you may want to implement your own rules that may be highly specific to your project/model.

LAMS offers a number of options to achieve this. (In addition to simply forking it)

- Project-level rule exemptions for rules that do not apply to you
- Custom rules written in a LISP-based expression, specified inline in your project
- Custom rules written in Javascript, hosted externally

## Project-level Rule Exemptions

To opt-out of a rule for your entire project, just use the rule_exemption syntax in your project's [manifest.lkml](https://docs.looker.com/reference/manifest-reference). For example:

```
# In your manifest.lkml file

# LAMS
# rule_exemptions: {
#  F2: "Any explanatory message you would like"
# }

```

## Expression Rules

Expression-based rules (available as of version 1.0) can be declared within your LookML, and consist of four parts. By way of example:

```
# in manifest.lkml

# LAMS
# rule: prod_connection {
#  description: "Prod models must use prod connection"
#  match: "$.model.*"
#  expr_rule: ( === ::match:connection "prod" ) ;;
# }

```

Here is what each part does:

- **Rule name:** Any LookML name for this rule. Note that names of the form [A-WY-Z][0-9]+ are reserved for future LAMS usage. This name is included in LAMS usage reporting, if you have opted in to it.
- **description:** (Optional) A succint human-readable description, which will be shown to developers in LAMS output
- **match:** A JSONpath expression that describes which LookML constructs to check. This usually matches multiple times within the project, and the rule is checked once for each such match. See [below](#match-examples) for example match patterns.
- **expr_rule:** A Liyad expression that defines the logic of the rule.
  - **Arguments:** Three arguments are made available to the expression:
    - `match`: The value matched by the match expression. (The expression is invoked once for each time the pattern is matched in your project)
    - `path`: An array containing the path to the matched LookML. For example, `['$','model','my_model']`
    - `project`: The entire LookML project, in case you need to further reference any data from it within each match
  - **Return value**
    - **true** - If your expression returns true, the test will be passed
    - **false** - If your expression returns false, the test will be failed
    - **string** - (Beta) If your expression returns a string, your test will be failed, and the string will be used as a description/message
    - **object** - (Beta) An object can be returned, specifying any of the following properties: level (info/warn/error), exempt, path, location, description, rule
    - **array of objects** - (Beta) Like the above, but in case you need to emit multiple messages per match
    - The return formats marked Beta are not expected to change, but are currently untested and may change slightly for compatibility reasons without a major semver update
  - **Language functions** - LAMS includes a command-line script, `rule-functions-doc.js`, that you can call for a comprehensive list of available functions. But, see [expression examples below](#expression-examples) for some common and useful ones!

Disclaimer: Expression evaluation is powered by the [Liyad](https://github.com/shellyln/liyad) library. It both intends to prevent escalation of privleges, and, unlike Javascript evaluation, theoretically *can* prevent it. ([See my writeup on this](https://fabio-looker.github.io/data/2019-10-15-lams-customization-update/)). However, it is still a very new project, so evaluate it accordingly.

### Match Examples

Note that while you can use unrooted paths to match things a bit more concisely (i.e. without the leading $.), using a rooted path means less ambiguity in case a LookML parameter is also valid in another context)

Not all examples below have been tested, so if you find an issue, please submit an issue!

| JSONpath                                | Description                                       |
| --------------------------------------- | ------------------------------------------------- |
| `$.model.*`                             | All models                                        |
| `$.files[*].view.*`                     | All views across all files (once per declaration) |
| `$.model.*.view.*`                      | All views included in models (once per inclusion) |
| `$.model.*.explore.*`                   | All explores across all models                    |
| `$.model.foo.explore.*`                 | All explores in the foo model                     |
| `$.model.*.view.*[dimension,measure].*` | All dimensions and all measures across all models |
| `$.model[?(@.persist_for)]`             | All models that declare persist_for               |

## Expression Examples

### Equality

```js
 (=== ::match:value_format_name "usd")
```

### String matching

e.g. does the label start with "Is" or "Has"? (Note that `$match` is a function, and `match` is the matched value)

```js
($boolean ($match
    "^Is |^Has "
    ::match:label
))
```

### Boolean And

```js
($all
    (=== ::match:hidden true)
    (=== ::match:extension_required true)
)
```

### Boolean Or

```js
($any
    (=== ::match:hidden true)
    (=== ::match:extension_required true)
    ...
)
```

### Sequential steps

```js
($let myvar (+ ::match:foo "_bar") )
(=== myvar "foo_bar")
```

## Javascript Rules

Disclaimer: The use of javascript rules are a security tradeoff. Fundamentally, evaluating Javascript code on your local machine and/or CI server gives that code a lot of access. And, this code can be altered by anyone with access to the server on which it is hosted, as well as any LookML developer with access to develop in the LookML project (even without deploy permissions). For this reason, expression based rules are preferred, and javascript-based rules may become deprecated in the future. If you nevertheless want LAMS to execute Javascript-based custom rules, run LAMS with the `--allow-custom-rules` startup flag. For a sample JS custom rule, see [/docs/sample-custom-rule.js](https://github.com/looker-open-source/look-at-me-sideways/blob/master/docs/sample-custom-rule.js)