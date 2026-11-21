<p>When a field uses <code>suggest_explore</code> or <code>suggest_dimension</code> to source filter suggestions, Looker's validator may not catch cases where the referenced explore, joined view, or dimension is unavailable in the model.</p>
<p>Ensure that:</p>
<ul>
	<li>If <code>suggest_explore</code> is specified, that explore exists in the model, and any <code>suggest_dimension</code> (qualified as <code>view_name.dimension_name</code> or unqualified within the current view) is available in that explore and exists in the target view.</li>
	<li>If only <code>suggest_dimension</code> is specified without <code>suggest_explore</code>, an unqualified <code>dimension_name</code> exists in the current view, and a qualified <code>view_name.dimension_name</code> is available in every non-hidden explore where the current view is used.</li>
</ul>

<code class="good block">
view: orders {
	dimension: customer_id {
		type: number
		suggest_explore: customer_analytics
		suggest_dimension: customers.customer_name
	}
}

view: customers {
	dimension: customer_name {
		type: string
	}
}

explore: customer_analytics {
	from: customers
}
</code>

<code class="bad block">
view: orders {
	dimension: customer_id {
		type: number
		suggest_explore: nonexistent_explore
		suggest_dimension: customers.customer_name
	}
}
</code>
