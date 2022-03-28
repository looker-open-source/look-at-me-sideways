view: user {
	# This view has non-key dimensions first, against K3, but K3 is globally exempt
	sql_table_name: user ;;

	dimension: info {
		description: "Something about this table"
	}

	dimension: pk1_user_id {}
}
