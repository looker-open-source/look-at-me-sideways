# T3: Table-Backed Views Must Declare Required Filter or Small Row Count

## Why?

Querying large tables without filtering on a partition, sort, or index key can trigger full table scans, inflating query latency and warehouse compute costs.

Declaring `#LAMS required_filter: <field_name>` on table-backed views (both native tables via `sql_table_name` and Persistent Derived Tables) ensures that explorers (see also rule `E4`) always filter on a selective column.

For small lookup or dimension tables, partition pruning is not beneficial when the table size is below the database's minimum block size (for example, BigQuery's minimum partition/block scan unit or Snowflake micro-partition size). Scanning a single block costs the same regardless of pruning, so for small tables a LookML data test asserting a maximum row count is an accepted alternative to `required_filter`.

## Sub-rules

- **T3.1**: Any view backed by a table (`sql_table_name` or a PDT, excluding ephemeral derived tables and views without a table) that is the base of a non-hidden explore must either declare `#LAMS required_filter: <field_name>` or be covered by a LookML `test:` on that explore asserting a maximum row count.
- **T3.2**: If `#LAMS required_filter: <field_name>` is present on the view, `<field_name>` must resolve to a valid field (dimension, dimension group / timeframe, filter, parameter, or measure) in that view.
- **T3.3**: If `#LAMS required_filter: <field_name>` is present and the view is a PDT with a `sql` definition (excluding `sql_create` and `create_process` PDTs), the referenced field's `sql` must contain `${TABLE}.<column>` matching the first entry of `sortkeys`, `indexes`, or `partition_keys` (if any is declared).

## Examples

### Native table (`sql_table_name`) with `required_filter`

```lookml
view: orders {
  #LAMS required_filter: created_date
  sql_table_name: analytics.orders ;;

  dimension_group: created {
    type: time
    timeframes: [date, week, month]
    sql: ${TABLE}.created_at ;;
  }
}
```

### PDT with `partition_keys` matching `required_filter`

```lookml
view: events_pdt {
  #LAMS required_filter: event_date
  derived_table: {
    sql: SELECT event_date, user_id FROM raw.events ;;
    datagroup_trigger: daily_etl
    partition_keys: ["event_date"]
  }

  dimension: event_date {
    type: date
    sql: ${TABLE}.event_date ;;
  }
}
```

### Small lookup table with a row-count data test

```lookml
view: country_codes {
  sql_table_name: ref.country_codes ;;
  dimension: code {
    sql: ${TABLE}.code ;;
  }
  measure: count {
    type: count
  }
}

explore: country_codes {}

test: country_codes_is_small {
  explore_name: country_codes
  assert: max_rows {
    expression: ${country_codes.count} <= 1000 ;;
  }
}
```
