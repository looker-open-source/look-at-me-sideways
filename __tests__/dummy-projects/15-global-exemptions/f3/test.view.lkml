view: user {
	# This view has a non-filtered count measure, against F3, but F3 is globally exempt
	sql_table_name: user ;;

	measure: ct {
		type: count
	}
}
