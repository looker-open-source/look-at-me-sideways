view: foo {
	sql_table_name: some_table;;

	dimension: pk1_foo_id {
		hidden: yes
		sql: ${TABLE}.id ;;
	}
	dimension: id {
		sql: ${TABLE}.id;;
		link: {
			label: "View in app"
			url: "https://myapp.example.com/thing/{{ value }}"
			icon_url: "https://myapp.example.com/favicon.ico"
		}
	}
	dimension: ref {
		sql: ${TABLE}.ref_id;;
		link: {
			label: "Thing 1"
			url: "https://thing1.example.com/thing/{{ value }}"
		}
		link: {
			label: "Thing 2"
			url: "https://thing2.exampke.com/thing/{{ value }}"
		}
	}
}