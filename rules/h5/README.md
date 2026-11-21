<p>Wrap an explore's base view in square brackets to visually distinguish it and hoist it to the top of the field picker.</p>
<p>The rule may be ignored for explores that have no joins, and for hidden explores.</p>
<p><b>Rationale:</b> Many or most explores in Looker follow a snowflake schema - a central fact table, and a number of many-to-one dimensional joins. Hoisting the main view that the explore represents to the top of the field picker helps visually reinforce the central/primary nature of that view within the explore.</p>
<code class="block good">
explore: orders {
	view_label: "[Orders]"
	...
</code>
<p><b>Note: </b>LAMS configuration can specify different prefixes/sufixes to use instead of the suggested square brackets. Make sure to use a prefix that sorts higher than other typically used characters</p>
<code class="block">
# Providing custom options in manifest.lkml

#LAMS
#rule: H5 {options: {
#   prefix: " 📊"
#   suffix: ""
#   enforceHidden: yes
#}}
</code>
