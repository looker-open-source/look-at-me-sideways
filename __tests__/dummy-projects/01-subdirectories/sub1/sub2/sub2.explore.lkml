include: "sub2.view.lkml"

explore: sub2 {
	join: junk {
		relationship: many_to_one
		sql_on: ${sub2.fk} = ${junk.fk} ;;
	}
}