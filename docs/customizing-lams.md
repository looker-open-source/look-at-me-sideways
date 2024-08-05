---
favicon: img/logo.png
---
# Customizing LAMS

LAMS comes pre-bundled with a number of rules that reflect our opinionated best practices. However, sometimes you may want to implement your own rules that may be highly specific to your project/model.

To handle this, LAMS offers the ability to extend it with custom rules written in a LISP-based expression, specified in a manifest.

## Custom Rules

# Quickstart

Expression-based rules can be declared within your manifest's LookML. By way of example:

```
# in manifest.lkml

# LAMS
# rule: prod_connection {
#  description: "Models must use prod connection"
#  match: "$.model.*"
#  expr_rule: ( === ::match:connection "prod" ) ;;
# }

```

Alternately, you can maintain them in YAML for nicer syntax:

```
# in a YAML file passed to the `manifest` argument
# (requires installing js-yaml)

rule:
  prod_connection:
    description: Models must use prod connection
    match: "$.model.*"
    expr_rule: |
      ( === ::match:connection "prod" )

```

### Rule Sandbox

You can quickly experiment with custom rule definitions in the [Rule Sandbox](tools/rule-sandbox)

### Rule Reference

Here is what each part of the rule definition means:

- **Rule name:** Any LookML name for this rule. This name is included in LAMS usage reporting, if you have opted in to it. Names composed of a single letter followed by a number are reserved for future LAMS usage.
- **allow_exemptions:** (Optional) A yesno value that indicates whether to respect rule exemption declarations. (Default: yes)
- **description:** (Optional) A succint human-readable description, which will be shown to developers in LAMS' output
- **enabled:** (Optional) A yesno value that indicates whether to use the rule. (Default: yes)
- **match:** A [JSONpath expression](https://www.npmjs.com/package/jsonpath-plus) that describes which LookML constructs to check. This usually matches multiple times within the project, and the rule is checked once for each such match. See [Rule Matching](#rule-matching) below for more details and example match patterns.
- **expr_rule:** A [Liyad](https://github.com/shellyln/liyad) expression that defines the logic of the rule.
  - **Arguments:** Three arguments are made available to the expression:
    - `match`: The value matched by the match expression. (The expression is invoked once for each time the pattern is matched in your project)
    - `path`: An array containing the path to the matched LookML. For example, `['$','model','my_model']`
    - `project`: The entire LookML project, in case you need to further reference any data from it within each match
  - **Return value**
    - **true** - If your expression returns true, the test will be passed
    - **false** - If your expression returns false, the test will be failed
    - **string** - If your expression returns a string, your test will be failed, and the string will be used as a description/message
    - **object** - (Beta) An object can be returned, specifying any of the following properties: level (info/warn/error), exempt, path, location, description, rule
    - **array of objects** - (Beta) Like the above, but in case you need to emit multiple messages per match
    - The return formats marked Beta are not expected to change, but are currently untested and may change slightly for compatibility reasons without a major semver update
  - **Language functions** - The FN Docs tab in [Rule Sandbox](tools/rule-sandbox) has a list of all available top-level functions. And, see [expression examples below](#expression-examples) for some common and useful ones!

Security Disclaimer: Expression evaluation is powered by the [Liyad](https://github.com/shellyln/liyad) library. It both intends to prevent escalation of privleges, and, unlike Javascript evaluation, theoretically *can* do so. ([See my writeup on this](https://fabio-looker.github.io/data/2019-10-15-lams-customization-update/)). However, it is still a very new project, so evaluate it accordingly.

### Rule Matching

The `match` property accepts a JSON Path expression. Further documentation about the JSON Path syntax can be found in the docs of the underlying library [jsonpath-plus](https://www.npmjs.com/package/jsonpath-plus).

Additionally, to avoid potential code-execution issues, LAMS limits filtering expressions to a property existence check, or a single equality or inequality operation between a property and a string, boolean, or undefined literal.

Note that while you can use unrooted paths to match things a bit more concisely (i.e. without the leading $.), using a rooted path means less ambiguity in case a LookML parameter is also valid in another context.

#### Examples

| JSONpath                                    | Description                                       |
| ------------------------------------------- | ------------------------------------------------- |
| `$.model.*`                                 | All models                                        |
| `$.file.*.view.*`                           | All views across all files (once per declaration) |
| `$.model.*.view.*`                          | All views included in models (once per inclusion) |
| `$.model.*.explore.*`                       | All explores across all models                    |
| `$.model.foo.explore.*`                     | All explores in the foo model                     |
| `$.model.*.view.*[dimension,measure].*`     | All dimensions and all measures across all models |
| `$.model[?(@.persist_for)]`                 | All models that declare persist_for               |

### Expression Examples

#### Equality

```lisp
 (=== ::match:value_format_name "usd")
```

#### Presence

```lisp
 (!== ::match:type undefined)
```

#### String matching

E.g., does the label start with "Is" or "Has"? (Note that `$match` is a function, and `match` is the matched value)

```lisp
($boolean ($match
    "^Is |^Has "
    ::match:label
))
```

#### Boolean And

```lisp
($all
    (=== ::match:hidden true)
    (=== ::match:extension_required true)
)
```

#### Boolean Or

```lisp
($any
    (=== ::match:hidden true)
    (=== ::match:extension_required true)
    ...
)
```

#### Sequential steps

```lisp
($let myvar (+ ::match:foo "_bar") )
(=== myvar "foo_bar")
```

### Lambdas and Iteration

```lisp
($let urls ($map links (-> (link) ::link:url)))
($let badUrls ($filter urls (-> (url) ($match "^http://" url))))
($if ::badUrls:length
	($concat "Links must not use insecure HTTP: " ($join ::badUrls ", "))
	true
)
```

### Accessing JavaScript methods

The below example calls JavaScript's native String.prototype.localeCompare method for sorting:

```lisp
($let dim-names ($object-keys ($any ::match:dimension (#))))
($let alphabetically (-> (a b) ($__call a localeCompare b)))
($let sorted-names ($sort dim-names alphabetically))
(== ($join dim-names ",") ($join sorted-names ","))
```

## Legacy Javascript Rules

Disclaimer: The use of javascript rules are a security tradeoff. Fundamentally, evaluating Javascript code on your local machine and/or CI server gives that code a lot of access. And, this code can be altered by anyone with access to the server on which it is hosted, as well as any LookML developer with access to develop in the LookML project (even without deploy permissions). For this reason, expression based rules are preferred, and javascript-based rules may be deprecated in the future.

If you nevertheless want LAMS to execute Javascript-based custom rules:

1. Write your rule following this example: [/docs/sample-custom-rule.js](https://github.com/looker-open-source/look-at-me-sideways/blob/master/docs/sample-custom-rule.js)
2. Host your JS code and provide its URL in your manifest.lkml, as `custom_rules: ["<url>"]` (inside a `#LAMS` comment block) 
3. Run LAMS with the `--allow-custom-rules` startup flag
