explore: bad {
	join: foo {
		relationship: many_to_one
		sql_on: ${foo.bar_id} = ${ok.bar_id} ;;
	}
}
