# T11: Asserted Uniques / Explicit `MIN`, `MAX`, and `ANY` Aggregates

## Why?

Developers sometimes use `MIN(...)`, `MAX(...)`, or `ANY_VALUE(...)` when grouping to pick a supposedly uniform value across rows, which silently hides data quality issues if the value is not actually unique. Rather than assuming the value is representative, either assert uniqueness (for example, by checking `MIN(x) <> MAX(x)`) or alias the column to make clear that it is a min, max, or arbitrary sample value.

## Rule

In a `derived_table`'s `SELECT` list, unguarded `MIN(...)`, `MAX(...)`, and `ANY(...)` / `ANY_VALUE(...)` expressions must be aliased to a name containing one of the allowed fragments:

- **`MIN`**: `min`, `minimum`, `first`, `earliest`
- **`MAX`**: `max`, `maximum`, `last`, `latest`
- **`ANY` / `ANY_VALUE`**: `any`, `sample`

Expressions that assert uniqueness by comparing `MIN(...)` and `MAX(...)` inside a `CASE` or `ERROR(...)` guard are allowed with any alias.

### Options

You can configure additional allowed alias fragments (for example, in other languages) in `manifest.lkml`:

```lkml
#rule: T11 {
#  options: {
#    min_fragments: ["minimo", "primeiro"]
#    max_fragments: ["maximo", "ultimo"]
#    any_fragments: ["qualquer"]
#  }
#}
```

## Examples

<code class="bad block">
view: user_accounts {
  derived_table: {
    sql:
      SELECT
        user_guid AS pk1_user_guid,
        MIN(account_id) AS account_id
      FROM events
      GROUP BY user_guid
    ;;
  }
}
</code>

<code class="good block">
view: user_accounts {
  derived_table: {
    sql:
      SELECT
        user_guid AS pk1_user_guid,
        CASE WHEN MIN(account_id) <> MAX(account_id)
          THEN ERROR("Non-unique account_id for user_guid")
          ELSE MIN(account_id)
        END AS account_id,
        MIN(created_at) AS first_created_at,
        MAX(created_at) AS latest_created_at,
        ANY_VALUE(region) AS sample_region
      FROM events
      GROUP BY user_guid
    ;;
  }
}
</code>
