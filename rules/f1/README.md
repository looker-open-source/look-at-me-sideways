<p>... unless this is (A) a field-only view, or (B) a tightly coupled view (provide a base explore too!)</p>
<p><b>Rationale:</b> Inter-view dependencies interfere with the re-use of the view<p>
<code class="block bad">
view: users {...}
view: orders {
  ...
  measure: orders_per_user {
    sql: ${count} / NULLIF(${users.count},0)
  }
}
explore: orders {} # Errors :(
</code>

<code class="block good">
view: users {...}
view: orders {...}
view: users_orders {
  # No need for a sql_table_name or derived_table
  measure: orders_per_user {
    sql: ${orders.count} / NULLIF(${users.count},0)
  }
}
explore: orders {} #Doesn't break like before!
explore: users {
  join: orders {...}
  join: users_orders {
    sql: ;;
    # Use `sql` instead of `sql_on` and put some whitespace in it
    relationship: one_to_one
    view_label: "Orders" #For cleaner explore UI
  }
}
</code>
