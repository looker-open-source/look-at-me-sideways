explore: unparseable {
	join: foo {
		relationship: many_to_one
		sql: ${foo.pk_foo_id} = ${ok.foo_id} ;;
	}
# } Missing closing brace to trigger syntax error
