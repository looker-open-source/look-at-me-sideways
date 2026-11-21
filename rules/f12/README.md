<p>Field <code>alias</code> declarations allow renaming fields while preserving backward compatibility for existing Explores, Looks, and Dashboards. If an alias collides with another field's name or another field's alias in the same view (including expanded <code>dimension_group</code> timeframes or duration intervals), Looker's field resolution becomes ambiguous.</p>

<code class="bad block">
view: orders {
	dimension: order_id {
		type: string
	}
	dimension: id {
		alias: [order_id] # Conflicts with dimension: order_id
		type: string
	}
	dimension: created {
		alias: [legacy_date]
	}
	dimension: updated {
		alias: [legacy_date] # Conflicts with alias on created
	}
}
</code>

<code class="good block">
view: orders {
	dimension: id {
		alias: [legacy_order_id]
		type: string
	}
	dimension_group: created {
		type: time
		timeframes: [date, week]
		alias: [order_created] # Expands to order_created_date, order_created_week
	}
}
</code>
