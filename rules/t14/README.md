# T14: Persisted Derived Tables Should Not Use Liquid or Dynamic SQL

## Why?

Triggered persistent derived tables (PDTs) do not have the explore query context needed to evaluate dynamic Liquid logic, and even `persist_for` derived tables do not behave as expected with dynamic SQL. Ephemeral (non-persisted) derived tables may use Liquid/dynamic SQL freely.

Note: `{{_model._name}}` is allowed because it is static within the context of a model.

## Rule

Any `derived_table` with persistence (`persist_for`, `datagroup_trigger`, `sql_trigger_value`, `interval_trigger`, `create_process`, `sql_create`, or `materialized_view`) must not contain Liquid tags (`{% ... %}`) or expressions (`{{ ... }}`) in its SQL, except `{{_model._name}}`.

## Examples

<code class="bad block">
view: user_orders_pdt {
  derived_table: {
    datagroup_trigger: daily_etl
    sql:
      SELECT user_id, COUNT(*) AS order_count
      FROM orders
      WHERE {% condition date_filter %} created_at {% endcondition %}
      GROUP BY 1
    ;;
  }
}
</code>

<code class="good block">
view: user_orders_ephemeral {
  derived_table: {
    sql:
      SELECT user_id, COUNT(*) AS order_count
      FROM orders
      WHERE {% condition date_filter %} created_at {% endcondition %}
      GROUP BY 1
    ;;
  }
}

view: user_orders_pdt {
  derived_table: {
    datagroup_trigger: daily_etl
    sql:
      SELECT user_id, COUNT(*) AS order_count
      FROM {{_model._name}}.orders
      GROUP BY 1
    ;;
  }
}
</code>
