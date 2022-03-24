explore: foo {
	join: bar {
		relationship: many_to_one
		sql_on: ${bar.pk1_bar_id} = ${foo.bar_id} ;;
	}
}
