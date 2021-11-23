# This example builds on the example from `08-object-iteration-rules`

# LAMS
# rule: unguarded_check { # This version of the rule will error on an empty view
#	match: "$.model.*.view.*"
#	description: "Views must have a dimension with primary_key:yes"
#	expr_rule: ($any ...($map
#       ( $object-values ::match:dimension )
#       ( -> (dim) ($boolean ::dim:primary_key))
#       ))
#   ;;
# }
# rule: guarded_check {
#	match: "$.model.*.view.*"
#	description: "Views _with any dimensions_ must have a dimension with primary_key:yes"
#	expr_rule: ($if
#     (!== ::match:dimension undefined)
#     ($any ...($map
#       ( $object-values ::match:dimension )
#       ( -> (dim) ($boolean ::dim:primary_key))
#       ))
#     true
#     )
#   ;;
# }
