view: user_product_affinity {
	derived_table: {
		# Would need this exemption to pass linting
		# rule_exemptions: {
		#	T2.6: "This DT is missing the --- separator from T8, but T8 is locally exempt"
		# }

		sql:
			SELECT
				pk2_user_id,
				pk2_product_id,
				COUNT(*) as ct
			FROM order_items
			GROUP BY 1,2
		;;
	}
}
