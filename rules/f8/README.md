<p>Non-hidden fields with <code>type: number</code> that represent numeric IDs or USD currency should specify an appropriate <code>value_format_name</code> (unless a custom <code>value_format</code> is already set):</p>
<ul>
	<li>Use <code>value_format_name: id</code> for numeric ID fields (detected from <code>primary_key: yes</code> or ID-related keywords in the field's name, <code>label</code>, or <code>description</code>).</li>
	<li>Use <code>value_format_name: usd</code> or <code>usd_0</code> for USD currency fields (detected from USD-related keywords in the field's name, <code>label</code>, or <code>description</code>).</li>
</ul>
<p><b>Rationale:</b> By default, Looker formats <code>type: number</code> fields with thousand separators (e.g., <code>12,345</code>) and no currency symbol, which is undesirable for numeric IDs and ambiguous for currency amounts.</p>
<code class="bad block">
view: orders {
	dimension: user_id {
		type: number
		sql: ${TABLE}.user_id ;;
	}
	measure: total_usd {
		type: number
		sql: ${TABLE}.amount_usd ;;
	}
}
</code>
<code class="good block">
view: orders {
	dimension: user_id {
		type: number
		value_format_name: id
		sql: ${TABLE}.user_id ;;
	}
	measure: total_usd {
		type: number
		value_format_name: usd_0
		sql: ${TABLE}.amount_usd ;;
	}
}
</code>
