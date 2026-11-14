<p>Long field names or labels are truncated in Looker's Explore field picker and visualization legends, making them harder for users to scan and distinguish. Keep field labels concise (30 characters or fewer by default), and use <code>description</code> for longer explanations.</p>
<p><b>Note:</b> In LAMS, you can customize the max length for this rule by setting a <code>maxLength</code> option associated with this rule in your manifest file.</p>

<code class="good block">
dimension: order_status {
	type: string
}
</code>

<code class="bad block">
dimension: order_status {
	label: "Current Fulfillment Status of the Customer Order"
	type: string
}
</code>

<code class="good block">
dimension: order_status {
	label: "Order Status"
	description: "Current fulfillment status of the customer order"
	type: string
}
</code>

<code class="block">
# Providing a custom limit in manifest.lkml

#LAMS
#rule: F9 {options: {maxLength: 40}}
</code>
