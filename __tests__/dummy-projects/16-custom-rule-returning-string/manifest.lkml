# Reuses the rule from 06-custom-rule-fields

# LAMS
# rule: no_abs_self_links {
#	match: "$.model.*.view.*.dimension.*.link"
#	description: "Self-links should be relative, not absolute."
#	expr_rule: 
#		($let links ($concat () ::match))
#		($let urls ($map links (-> (link) ::link:url)))
#		($let badUrls ($filter urls (-> (url) ($match "^https?://my.looker.com" url))))
#		($if ::badUrls:length
#			($concat "Self-links should not be absolute. Found " ($join ::badUrls ", "))
#			true
#		)
#	;;
# }

