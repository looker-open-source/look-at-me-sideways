<p>Looker filter expressions handle <code>"NOT NULL"</code> and <code>"-NULL"</code> differently depending on the target field's data type:</p>
<ul>
	<li><b>String fields</b> (<code>type: string</code>, <code>type: zipcode</code>, or default untyped dimensions): <code>"-NULL"</code> checks for SQL <code>IS NOT NULL</code>, whereas <code>"NOT NULL"</code> matches the literal string <code>'NOT NULL'</code>.</li>
	<li><b>Numeric fields</b> (<code>type: number</code>): <code>"NOT NULL"</code> checks for SQL <code>IS NOT NULL</code>, whereas <code>"-NULL"</code> is invalid number filter syntax.</li>
	<li><b>Date &amp; timestamp fields</b> (<code>type: time</code> / <code>type: date</code>, e.g., <code>created_date</code> or <code>created_time</code>): Both <code>"NOT NULL"</code> and <code>"-NULL"</code> compile to <code>IS NOT NULL</code>. Note that <code>raw</code> timeframes (<code>*_raw</code>) cannot be used in filters; filter on a non-raw timeframe such as <code>*_date</code> or <code>*_time</code> instead.</li>
</ul>
<p>See also rule <a href="#f11">F11</a> for filtered measures.</p>

<code class="good block">
explore: orders {
	always_filter: {
		filters: [orders.status: "-NULL", orders.amount: "NOT NULL"]
	}
}
</code>

<code class="bad block">
explore: orders {
	always_filter: {
		filters: [orders.status: "NOT NULL", orders.amount: "-NULL"]
	}
}
</code>
