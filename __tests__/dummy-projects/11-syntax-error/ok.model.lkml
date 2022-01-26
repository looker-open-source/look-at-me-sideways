explore: ok {
	join: foo {
		relationship: many_to_one
		sql_on: ${foo.pk1_foo_id} = ${ok.foo_id} ;;
	}
}
