
# LAMS
# rule: native_primary_key_required {
#	match: "$.model.*.view.*"
#	description: "Views must have a dimension with primary_key:yes"
#	expr_rule: ($any ...($map
#       ( $object-values ::match:dimension )
#       ( -> (dim) ($boolean ::dim:primary_key))
#       ))
#   ;;
# }

