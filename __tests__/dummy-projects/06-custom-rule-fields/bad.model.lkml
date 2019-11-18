view: bad_view {
	dimension: foo {
		sql: ${TABLE}.foo ;;
	}
	measure: bar {
		sql: ${foo} ;;
	}
}