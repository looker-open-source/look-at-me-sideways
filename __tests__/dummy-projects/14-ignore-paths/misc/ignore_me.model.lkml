explore: foo {
	join: bar_bad {
		relationship: one_to_one
		sql_on: bar.pk1_bar_id = foo.bar_id ;;
	}
}
