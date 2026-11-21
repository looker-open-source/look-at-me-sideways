<code class="good block">
explore: orders {
	join: users {
		relationship: many_to_one
		sql_on: ${users.1pk_id} = ${orders.user_id} ;;
	}
}
</code>
<code class="bad block">
explore: orders {
	join: users {
		relationship: many_to_one
		sql_on: users.id = orders.user_id ;;
	}
}
</code>
<p><b>Note:</b> Sometimes you may want to make joins dynamic using <code>_in_query</code>. This requires you to reference fields to join on IF the view is <code>_in_query</code> but NOT use the substitution operator since that forces the view to be in the query.</p>
