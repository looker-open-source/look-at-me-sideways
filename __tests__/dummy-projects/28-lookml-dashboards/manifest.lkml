#LAMS
#rule: DASH_1 {
#	description: "`model` attribute should not be set (allow inheritance based on model inclusion)"
#	match: "$.model.*.dashboard.*[0].elements.*"
#	expr_rule: 
#		(=== ::match:model undefined)
#	;;
#}
