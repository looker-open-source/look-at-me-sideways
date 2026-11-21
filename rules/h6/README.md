<p>When the numer of views in an explore's field picker exceeds 20, use label prefixes to sort and organize views.</p>
<code class="block good">
explore: orders {
	join: user {}
	join: first_orders {
		view_label: "User > First Order"
	}
	join: first_orders {
		view_label: "User > First Order"
	}
	...
</code>
<p><b>Note: </b>LAMS configuration can specify a different delimiter and/or threshold.</p>
<code class="block">
# Providing custom options in manifest.lkml

#LAMS rule: H6 {options: {threshold: 10 delimiter: ": "}}
</code>
