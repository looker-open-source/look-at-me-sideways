<p>Among other reasons to favor brevity, long explore names/labels will be truncated in Looker's Explore picker UI. Help maintain a good experience for end users by keeping Explore names at or below 25 characters.</p>
<p><b>Note:</b> In LAMS, you can customize the max length for this rule by setting a </code>maxLength</code> option associated with this rule in your manifest file. </p>	

<code class="good block">
explore: orders {}
</code>

<code class="bad block">
explore: orders {
	label:"Data Warehouse: BigQuery > Schema: Business > Datamart: eCommerce > Facts > Orders"
}
</code>

<code class="good block">
explore: orders {
	label: "Orders"
	description: "Data Warehouse: BigQuery > Schema: Business > Datamart: eCommerce > Facts > Orders"
}
</code>

<code class="block">
# Providing a custom limit in manifest.lkml

#LAMS
#rule: E7 {options: {maxLength: 50}}
</code>
