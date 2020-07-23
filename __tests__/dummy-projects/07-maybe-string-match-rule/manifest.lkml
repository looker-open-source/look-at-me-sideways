
# LAMS
# rule: maybe_string_match {
#	match: "$.model.*.explore.*"
#	description: "Explores must have sql_always_where, matching a certain regex"
#	expr_rule: ($boolean ($match
#       "^ *\\{\\{_user_attributes\\['business_user']}} == 'true' *$"
#       ::match:sql_always_where
#       ))
#   ;;
# }

