# T15: Avoid Unqualified `UNION` (Prefer `UNION ALL`)

## Why?

Developers often write `UNION` instead of `UNION ALL` unintentionally, triggering an expensive sort/deduplication across all columns. If deduplication is actually required, make that intent explicit with `UNION DISTINCT` or an accompanying comment such as `UNION /*DISTINCT*/`.

## Rule

SQL in `derived_table` or `sql_table_name` must not use bare `UNION`. Use `UNION ALL`, `UNION DISTINCT`, or include an accompanying comment immediately after `UNION` (e.g., `UNION /*DISTINCT*/`).

## Examples

<code class="bad block">
view: combined_events {
  derived_table: {
    sql:
      SELECT id, event_type FROM web_events
      UNION
      SELECT id, event_type FROM mobile_events
    ;;
  }
}
</code>

<code class="good block">
view: combined_events {
  derived_table: {
    sql:
      SELECT id, event_type FROM web_events
      UNION ALL
      SELECT id, event_type FROM mobile_events
    ;;
  }
}

view: deduplicated_events {
  derived_table: {
    sql:
      SELECT id, event_type FROM web_events
      UNION /*DISTINCT*/
      SELECT id, event_type FROM mobile_events
    ;;
  }
}
</code>
