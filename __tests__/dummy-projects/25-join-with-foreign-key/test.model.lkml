# See https://github.com/looker-open-source/look-at-me-sideways/issues/130

view: order_items {}
view: products {}

explore: order_items {
	join: products {
		relationship: many_to_one
		foreign_key: fk_product_id
	}
}
