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
	describe('E4', () => {
		it('should pass when base view has no required_filter or explore is hidden', () => {
			const project = parseProject(`
				model: my_model {
					explore: normal_exp {}
					explore: hidden_exp {
						hidden: yes
					}
					view: normal_exp {
						sql_table_name: analytics.normal ;;
					}
					view: hidden_exp {
						#LAMS required_filter: created_date
						sql_table_name: analytics.hidden ;;
						dimension: created_date { type: date sql: \${TABLE}.created_at ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('should error when explore lacks always_filter for base view required_filter', () => {
			const project = parseProject(`
				model: my_model {
					explore: orders {}
					view: orders {
						#LAMS required_filter: created_date
						sql_table_name: analytics.orders ;;
						dimension: created_date { type: date sql: \${TABLE}.created_at ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toHaveLength(1);
		});

		it('should error when explore uses from/view_name and lacks always_filter', () => {
			const project = parseProject(`
				model: my_model {
					explore: recent_orders {
						from: orders
						always_filter: {
							filters: [recent_orders.status: "complete"]
						}
					}
					view: orders {
						#LAMS required_filter: created_date
						sql_table_name: analytics.orders ;;
						dimension: created_date { type: date sql: \${TABLE}.created_at ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toHaveLength(1);
		});

		it('should pass when explore declares always_filter referencing the required_filter (map-list syntax)', () => {
			const project = parseProject(`
				model: my_model {
					explore: recent_orders {
						from: orders
						always_filter: {
							filters: [recent_orders.created_date: "7 days"]
						}
					}
					view: orders {
						#LAMS required_filter: created_date
						sql_table_name: analytics.orders ;;
						dimension: created_date { type: date sql: \${TABLE}.created_at ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('should pass when explore declares always_filter using legacy field/value syntax', () => {
			const project = parseProject(`
				model: my_model {
					explore: orders {
						always_filter: {
							filters: {
								field: orders.created_date
								value: "30 days"
							}
						}
					}
					view: orders {
						#LAMS required_filter: created_date
						sql_table_name: analytics.orders ;;
						dimension: created_date { type: date sql: \${TABLE}.created_at ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});
	});
});
