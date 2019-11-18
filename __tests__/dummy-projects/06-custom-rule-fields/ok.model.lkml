view: ok_view {
	dimension: foo {
		type: string
		sql: ${TABLE}.foo ;;
	}
	measure: bar {
		type: list
		sql: ${foo} ;;
	}
}