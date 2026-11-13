<p>"Plain" count fields can/should specify a filter of "primary key dimensions (or any non-nullable field) are not null"</p>
<p><b>Rationale:</b> By default Looker will implement any non-filtered & non-distinct count field as a `COUNT(*)`. Filtering such "plain" counts on PK IS NOT NULL ensures correct counts in all of the following uses of the field: Counting just that table, counting that table when joined on as a one-to-one-or-zero table, counting that table with symmetric aggregates when joined on as a many_to_one table, and counting that table in explores with join paths.</b>
<code class="block good">
measure: count {
	type: count
	filters:{
		field: pk1_user_id
		value: "NOT NULL"
	}
}
</code>
<p><b>Note:</b> The <a href="https://docs.looker.com/reference/filter-expressions">LookML filter syntax</a> for "is not null" varies depending on the type of the field. For strings, use <code>-NULL</code>. For numbers, use <code>NOT NULL</code>.</p>
