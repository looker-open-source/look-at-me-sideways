
#LAMS
#rule: files_strings_present {
#	match: "$.file.*"
#	description: "Files should contain $strings."
#	expr_rule:
#		($if (!== undefined ::match:$strings)
#			(# 
#				("level" "info")
#				("description" "$strings is present")
#				)
#			"No $strings found"
#			)
#	;;
#}
