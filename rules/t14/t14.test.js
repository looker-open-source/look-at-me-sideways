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
	describe('T14', () => {
		it('should pass for ephemeral derived tables using Liquid', () => {
			const project = parseProject(`
				model: my_model {
					view: ephemeral_dt {
						derived_table: {
							sql:
								SELECT user_id
								FROM orders
								WHERE {% condition created_date %} created_at {% endcondition %}
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should pass for PDTs without Liquid or using only {{_model._name}}', () => {
			const project = parseProject(`
				model: my_model {
					view: static_pdt {
						derived_table: {
							datagroup_trigger: daily
							sql: SELECT user_id FROM {{ _model._name }}.orders ;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should error for PDTs using Liquid tags or expressions', () => {
			const project = parseProject(`
				model: my_model {
					view: dynamic_tag_pdt {
						derived_table: {
							datagroup_trigger: daily
							sql:
								SELECT user_id
								FROM orders
								WHERE {% parameter status_filter %} = status
							;;
						}
					}
					view: dynamic_expr_pdt {
						derived_table: {
							persist_for: "24 hours"
							sql:
								SELECT user_id
								FROM orders
								WHERE status = '{{ status_filter._parameter_value }}'
							;;
						}
					}
				}
			`);
			const errors = errorMessages(rule(project));
			expect(errors).toHaveLength(2);
		});

		it('should ignore Liquid inside SQL comments', () => {
			const project = parseProject(`
				model: my_model {
					view: commented_pdt {
						derived_table: {
							datagroup_trigger: daily
							sql:
								-- {% if true %}
								/* {{ something }} */
								SELECT 1 AS id
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});
	});
});
