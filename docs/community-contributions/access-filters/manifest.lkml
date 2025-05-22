# LAMS
# rule: access_filter_user_attribute_models {
#   description: "All explores in MNPI models must use the user attribute can_see_revenue_mnpi"
#   match: "$.model.*.explore.*[access_filter]"
#   expr_rule: |
#    (=== ::match:user_attribute "can_see_revenue_mnpi") ;;
# }
# rule: access_filter_field_models {
#   description: "All explores in MNPI models must use the field mnpi_access_control.is_mnpi"
#   match: "$.model.*.explore.*[access_filter]"
#   expr_rule: |
#    (=== ::match:field "mnpi_access_control.is_mnpi") ;;
# }
# rule: access_filter_or_required_access_grant_exists_explores {
#   description: "All explores in explore files must contain an access filter block for mnpi user attributes or required_access_grants label can_see_revenue_mnpi"
#   match: "$.file.*.explore.*"
#   expr_rule: |
#    ($__or (!= ::match:access_filter null) ($boolean ($match "can_see_revenue_mnpi" ::match:required_access_grants))) ;;
# }
# rule: access_filter_user_attribute_explores {
#   description: "All explores in explore files must use the user attribute can_see_revenue_mnpi"
#   match: "$.file.*.explore.*[access_filter]"
#   expr_rule: |
#    (=== ::match:user_attribute "can_see_revenue_mnpi") ;;
# }
# rule: access_filter_field_explores {
#   description: "All explores in explore files must use the field mnpi_access_control.is_mnpi"
#   match: "$.file.*.explore.*[access_filter]"
#   expr_rule: |
#    (=== ::match:field "mnpi_access_control.is_mnpi") ;;
# }
