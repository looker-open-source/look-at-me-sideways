# This example builds on the example from `08-object-iteration-rules`

# LAMS
# rule: guarded_check {
#	match: "$.files[*]"
#	description: "..."
#	expr_rule: ($if
#     (=== ::match:view undefined)
#     true
#     ($not ($any
#       ($not ($match ::match:$file_path ".ext.view.lkml"))
#       ($any ...($map
#         ($object-values ::match:view )
#         (-> (view) ($boolean ::view:extends))
#         ))
#       ))
#     )
#   ;;
# }
