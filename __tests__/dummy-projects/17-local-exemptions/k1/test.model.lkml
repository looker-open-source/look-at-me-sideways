view: user {
	# LAMS
	# rule_exemptions: {
	#	K1: "This is not implementing the primary key naming convention"
	# }

	sql_table_name: user ;;

	dimension: info {
		description: "Something about this table"
	}

	dimension: id {
		primary_key: yes
		# I have decided not to follow the K1 naming convention, and exempted the view from this rule
	}
}
