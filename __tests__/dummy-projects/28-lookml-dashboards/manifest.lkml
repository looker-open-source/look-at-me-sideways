#LAMS
#rule: DASH_1 {
#	description: "`model` attribute should not be set (allow inheritance based on model inclusion)"
#	match: "$.model.*.dashboard.*.elements.*"
#	expr_rule: 
#		(=== ::match:model undefined)
#	;;
#}
