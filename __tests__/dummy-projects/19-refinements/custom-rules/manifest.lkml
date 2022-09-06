
# LAMS
#
# rule: explore_descriptions {
#	match: "$.model.*.explore.*"
#	description: "Explores must specify a description"
#	expr_rule: ( !== ::match:description undefined ) ;;
# }
#
# rule: dimension_types {
#	match: "$.model.*.view.*.dimension.*"
#	description: "Dimensions must specify a type"
#	expr_rule: ( !== ::match:type undefined ) ;;
# }

