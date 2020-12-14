
# LAMS
# rule: maybe_string_match {
#	match: "$.model.*.view.*"
#	description: "Views must have a dimension with primary_key:yes"
#	expr_rule: ($any ($map
#       ( object-values ::match:dimension )
#       ( -> dim ($boolean ::dim:primary_key))
#       ))
#   ;;
# }

