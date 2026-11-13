<p>When already using group_label (or when having a number of dimension groups), if the number of groups under a view's field picker exceeds 10, use label prefixes to sort and organize groups. Separate the prefix with " > " to visually indicate hierarchy.</p>
<code class="block bad">
	# Labels below aligned to help illustrate field picker
	dimension: annual_contract_value {        group_label: "ACV" ...}
	dimension: widgets_annual_contract_value {group_label: "ACV" ...}
	dimension_group: close_date {             group_label: "Close" ...}
	dimension: incremental_acv {              group_label: "IACV" ...}
	dimension: widgets_incremental_acv {      group_label: "IACV" ...}
	dimension_group: start_date {             group_label: "Start" ...}
	dimension: total_contract_value {         group_label: "TCV" ...}
	dimension: widgets_tv {                   group_label: "TCV" ...}
	...
</code>
<code class="block good">
	# Labels below aligned to help illustrate field picker
	dimension_group: close_date {             group_label: "Dates > Close" ...}
	dimension_group: start_date {             group_label: "Dates > Start" ...}
	dimension: annual_contract_value {        group_label: "Value > ACV" ...}
	dimension: widgets_annual_contract_value {group_label: "Value > ACV" ...}
	dimension: incremental_acv {              group_label: "Value > IACV" ...}
	dimension: widgets_incremental_acv {      group_label: "Value > IACV" ...}
	dimension: total_contract_value {         group_label: "Value > TCV" ...}
	dimension: widgets_tv {                   group_label: "Value > TCV" ...}
</code>

<p><b>Note: </b>LAMS configuration can specify a different threshold to use instead of 10, and a different delimiter to use:</p>
<code class="block">
# Providing options in manifest.lkml

#LAMS
#rule: H3 {options: {threshold: 12 delimiter: ": "}}
</code>
