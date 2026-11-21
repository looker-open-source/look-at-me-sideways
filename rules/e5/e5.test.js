/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const rule = require('./index.js');
const {parse} = require('lookml-parser');

function parseProject(lkml) {
	return parse(lkml, {conditionalCommentString: 'LAMS'});
}

function errorMessages(result) {
	return result.filter((m) => m.level === 'error');
}

describe('Rules', () => {
	describe('E5', () => {
		it('should pass when explore has no joins or only many_to_one / one_to_one joins', () => {
			const project = parseProject(`
				model: my_model {
					explore: simple {}
					explore: orders {
						join: users {
							relationship: many_to_one
							sql_on: \${orders.user_id} = \${users.id} ;;
						}
						join: order_details {
							relationship: one_to_one
							sql_on: \${orders.id} = \${order_details.order_id} ;;
						}
						join: default_rel {
							sql_on: \${orders.account_id} = \${default_rel.id} ;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should pass for a single one_to_many join', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						join: orders {
							relationship: one_to_many
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should pass for a linear one_to_many chain', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						join: orders {
							relationship: one_to_many
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
						join: order_items {
							relationship: one_to_many
							sql_on: \${orders.id} = \${order_items.order_id} ;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should pass when a many_to_one join is attached to a one_to_many join', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						join: orders {
							relationship: one_to_many
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
						join: stores {
							relationship: many_to_one
							sql_on: \${orders.store_id} = \${stores.id} ;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should error on branching one_to_many joins from the base explore', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						join: orders {
							relationship: one_to_many
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
						join: favorites {
							relationship: one_to_many
							sql_on: \${users.id} = \${favorites.user_id} ;;
						}
					}
				}
			`);
			const errors = errorMessages(rule(project));
			expect(errors).toHaveLength(1);
			expect(errors[0].description).toContain('orders');
			expect(errors[0].description).toContain('favorites');
		});

		it('should error on branching one_to_many joins from an intermediate join', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						join: orders {
							relationship: one_to_many
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
						join: order_items {
							relationship: one_to_many
							sql_on: \${orders.id} = \${order_items.order_id} ;;
						}
						join: refunds {
							relationship: one_to_many
							sql_on: \${orders.id} = \${refunds.order_id} ;;
						}
					}
				}
			`);
			const errors = errorMessages(rule(project));
			expect(errors).toHaveLength(1);
			expect(errors[0].description).toContain('order_items');
			expect(errors[0].description).toContain('refunds');
		});

		it('should error on many_to_many joins', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						join: tags {
							relationship: many_to_many
							sql_on: \${users.id} = \${tags.user_id} ;;
						}
					}
				}
			`);
			const errors = errorMessages(rule(project));
			expect(errors).toHaveLength(1);
			expect(errors[0].description).toContain('many_to_many');
		});

		it('should respect LAMS rule exemptions on explore or join', () => {
			const project = parseProject(`
				model: my_model {
					explore: users {
						# LAMS
						# rule_exemptions: {
						#   E5: "Intentional"
						# }
						join: orders {
							relationship: one_to_many
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
						join: favorites {
							relationship: one_to_many
							sql_on: \${users.id} = \${favorites.user_id} ;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});
	});
});
