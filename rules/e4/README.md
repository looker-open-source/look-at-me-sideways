# E4: Explores Must Enforce Base View Required Filter

## Why?

When a table-backed view declares `#LAMS required_filter: <field_name>` (see rule `T3`), that declaration documents which field should be filtered to avoid expensive full-table scans. Rule `E4` ensures that every non-hidden explore based on that view enforces the filter via `always_filter`.

## Rule

For any non-hidden `explore` whose base view (`explore.from`, `explore.view_name`, or the explore's own name) declares `#LAMS required_filter: <field_name>`, the explore must declare an `always_filter` referencing `<field_name>` (qualified as `<explore_name>.<field_name>`, `<view_name>.<field_name>`, or unqualified).

## Example

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

explore: recent_orders {
  from: orders
  always_filter: {
    filters: [recent_orders.created_date: "7 days"]
  }
}
```
