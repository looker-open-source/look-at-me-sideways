<p><b>Note:</b> Specifying join logic using <code>sql_on</code> is usually preferred to using <code>foreign_key</code>, as <code>sql_on</code> is more general-purpose.</p>
<p>If you do use <code>foreign_key</code> to specify your join logic, Looker will implicitly join this declared foreign key against the primary key of the joined table. As such, the resulting join should be a many_to_one join (or rarely one_to_one if you use the primary key of the base view as the foreign key in the join)</p>

<code class="bad block">
explore: orders {
	join: users {
		foreign_key: user_id
		relationship: many_to_many
	}
}
</code>

<code class="good block">
explore: orders {
	join: users {
		foreign_key: user_id
		relationship: many_to_one
	}
}
</code>

<code class="good block">
# Joins are already implicitly many_to_one by default, so this is ok
explore: orders {
	join: users {
		foreign_key: user_id
	}
}
</code>

<code class="good block">
# In some cases, one_to_one is appropriate
explore: orders {
	join: orders_derived_table {
		foreign_key: pk1_order_id
		relationship: one_to_one
	}
}
</code>
