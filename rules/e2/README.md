<p> This is relevant for any 1:1, 1:m, m:1, 1:0or1 joins. In otherwords, any non-many-to-many join (which you should only be using with great caution)</p>
<code class="good block">
join: users {
  relationship: many_to_one
  sql_on: ${pk1_user_id} = ${orders.user_id} ;;
}
</code>

<code class="bad block">
join: users {
  relationship: many_to_one
  sql_on: ${users.id} = ${orders.user_id} ;;
  # ^ I can only _hope_ that this is right, or spend time verifying it
}
</code>

<code class="questionable block">
join: dates {
  relationship: many_to_many
  sql_on: ${dates.pk1_date} >= $[users.created_date} AND ${dates.pk1_date} <= $[users.deleted_date} ;;
}
</code>
