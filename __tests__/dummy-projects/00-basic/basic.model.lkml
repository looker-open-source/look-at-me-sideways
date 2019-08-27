explore: foo {}

view: foo {
	sql_table_name: foo ;;
	dimension: pk1_foo_id {
		hidden: yes
		sql: id ;;
	}
}