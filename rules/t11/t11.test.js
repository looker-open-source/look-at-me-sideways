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
	describe('T11', () => {
		it('should pass for asserted MIN/MAX uniqueness checks', () => {
			const project = parseProject(`
				model: my_model {
					view: user_accounts {
						derived_table: {
							sql:
								SELECT
									user_guid AS pk1_user_guid,
									COUNT(*) AS events,
									CASE WHEN MIN(account_id) <> MAX(account_id)
										THEN ERROR("Non-unique violation")
										ELSE MIN(account_id)
									END AS account_id,
									MIN(org_id) || SUBSTR('', 0 / CASE WHEN MIN(org_id) <> MAX(org_id) THEN 0 ELSE 1 END) AS org_id
								FROM events
								GROUP BY user_guid
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should pass when unguarded MIN, MAX, or ANY_VALUE uses an allowed alias fragment', () => {
			const project = parseProject(`
				model: my_model {
					view: user_stats {
						derived_table: {
							sql:
								SELECT
									user_id,
									MIN(price) AS min_price,
									MIN(created_at) AS earliest_order_at,
									MIN(status) AS first_status,
									MAX(price) AS max_price,
									MAX(created_at) AS latest_order_at,
									MAX(status) AS last_status,
									ANY_VALUE(country) AS any_country,
									ANY(city) AS sample_city
								FROM orders
								GROUP BY 1
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should error on unguarded MIN, MAX, or ANY without an allowed alias fragment', () => {
			const project = parseProject(`
				model: my_model {
					view: bad_dt {
						derived_table: {
							sql:
								SELECT
									user_id,
									MIN(account_id) AS account_id,
									MAX(CASE WHEN status = 'a' THEN amount END) AS a_amount,
									ANY_VALUE(region) AS region,
									MIN(score)
								FROM events
								GROUP BY 1
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toHaveLength(4);
		});

		it('should support custom allowed fragments via manifest options', () => {
			const project = parseProject(`
				manifest: {
					# LAMS
					# rule: T11 {
					#   options: {
					#     min_fragments: ["minimo"]
					#     max_fragments: ["maximo"]
					#     any_fragments: ["qualquer"]
					#   }
					# }
				}
				model: my_model {
					view: pt_dt {
						derived_table: {
							sql:
								SELECT
									user_id,
									MIN(val) AS valor_minimo,
									MAX(val) AS valor_maximo,
									ANY_VALUE(reg) AS qualquer_regiao
								FROM events
								GROUP BY 1
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});
	});
});
