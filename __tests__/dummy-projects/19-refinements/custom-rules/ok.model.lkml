explore: needs_refinement {}

view: needs_refinement {
	sql_table_name: foo ;;
	dimension: id {}
}

explore: +needs_refinement {
	description: "Very refined description"
}

view: +needs_refinement {
	dimension: id { type: string }
}
