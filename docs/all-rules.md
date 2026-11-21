---
favicon: img/logo.png
---
<!-- This file is generated, and any manual changes will be overwritten. See scripts/build-docs.js -->
# Opting In to Built-in Rules

As of LAMS v3, built-in rules must be opted in to via your project's manifest (except `P0` and `P1`, which are enabled by default). Since the rules are opinionated, you should pick and choose the ones that make sense for your project.

## LookML (`manifest.lkml`)

```lkml
#LAMS
## Key Dimensions
#rule: K1{} # Primary key naming
#rule: K3{} # Primary keys first
#rule: K4{} # Primary keys hidden
#rule: K7{} # Provide one primary_key
#rule: K8{} # primary_key uses PK dims
## Other Fields
#rule: F1{} # No cross-view fields
#rule: F2{} # No view-labeled fields
#rule: F3{} # Count fields filtered
#rule: F4{} # Description or hidden
#rule: F8{} # Numeric ID/USD value_format_name
#rule: F9{} # Field label 30-char max
#rule: F10{} # Valid suggest_explore / suggest_dimension
#rule: F11{} # Correct NOT NULL / -NULL in measure filters
#rule: F12{} # No conflicting field aliases
## Transformations & Tables
#rule: T1{} # Triggers use datagroups
#rule: T2{} # Primary keys in DT
#rule: T3.1{} # Table views require filter or row-count test
#rule: T3.2{} # required_filter references valid view field
#rule: T3.3{} # PDT required_filter matches first key
#rule: T11{} # Assert or explicitly alias MIN/MAX/ANY
#rule: T14{} # No Liquid/dynamic SQL in PDTs
#rule: T15{} # Prefer UNION ALL over bare UNION
## Explores
#rule: E1{} # Join with subst'n operator
#rule: E2 { options: { strict_mode: yes } } # Join on PK for "one" joins
#rule: E4{} # Enforce base view required_filter
#rule: E5{} # Avoid multiplicative fanout
#rule: E6{} # FK joins are m:1
#rule: E7{} # Explore label 25-char max
#rule: E8{} # Correct NOT NULL / -NULL in explore filters
## Hierarchy
#rule: H1{} # Hoist identifiers
#rule: H2{} # Group fields
#rule: H3{} # Sort-group groups
#rule: H4{} # Group more
#rule: H5{} # Hoist main view
#rule: H6{} # Sort-group views
## Whitespace
#rule: W1{} # Block indentation
## Parser Errors & Validation
#rule: P0{} # Generic parser errors (default enabled)
#rule: P1{} # LookML syntax errors (default enabled)
#rule: P2{} # Duplicate singular property errors
#rule: P3{} # Invalid property type errors
#rule: P4{} # Missing required property errors
```

## YAML (for `manifest` CLI / config)

```yaml
rule:
  # Key Dimensions
  K1: {} # Primary key naming
  K3: {} # Primary keys first
  K4: {} # Primary keys hidden
  K7: {} # Provide one primary_key
  K8: {} # primary_key uses PK dims
  # Other Fields
  F1: {} # No cross-view fields
  F2: {} # No view-labeled fields
  F3: {} # Count fields filtered
  F4: {} # Description or hidden
  F8: {} # Numeric ID/USD value_format_name
  F9: {} # Field label 30-char max
  F10: {} # Valid suggest_explore / suggest_dimension
  F11: {} # Correct NOT NULL / -NULL in measure filters
  F12: {} # No conflicting field aliases
  # Transformations & Tables
  T1: {} # Triggers use datagroups
  T2: {} # Primary keys in DT
  T3.1: {} # Table views require filter or row-count test
  T3.2: {} # required_filter references valid view field
  T3.3: {} # PDT required_filter matches first key
  T11: {} # Assert or explicitly alias MIN/MAX/ANY
  T14: {} # No Liquid/dynamic SQL in PDTs
  T15: {} # Prefer UNION ALL over bare UNION
  # Explores
  E1: {} # Join with subst'n operator
  E2: # Join on PK for "one" joins
    options:
      strict_mode: true
  E4: {} # Enforce base view required_filter
  E5: {} # Avoid multiplicative fanout
  E6: {} # FK joins are m:1
  E7: {} # Explore label 25-char max
  E8: {} # Correct NOT NULL / -NULL in explore filters
  # Hierarchy
  H1: {} # Hoist identifiers
  H2: {} # Group fields
  H3: {} # Sort-group groups
  H4: {} # Group more
  H5: {} # Hoist main view
  H6: {} # Sort-group views
  # Whitespace
  W1: {} # Block indentation
  # Parser Errors & Validation
  P0: {} # Generic parser errors (default enabled)
  P1: {} # LookML syntax errors (default enabled)
  P2: {} # Duplicate singular property errors
  P3: {} # Invalid property type errors
  P4: {} # Missing required property errors
```
