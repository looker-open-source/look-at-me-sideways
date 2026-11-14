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
	describe('T15', () => {
		it('should pass for UNION ALL, UNION DISTINCT, and UNION /*DISTINCT*/', () => {
			const project = parseProject(`
				model: my_model {
					view: v_all {
						derived_table: {
							sql: SELECT 1 AS id UNION ALL SELECT 2 AS id ;;
						}
					}
					view: v_distinct {
						derived_table: {
							sql: SELECT 1 AS id UNION DISTINCT SELECT 2 AS id ;;
						}
					}
					view: v_comment {
						derived_table: {
							sql: SELECT 1 AS id UNION /*DISTINCT*/ SELECT 2 AS id ;;
						}
					}
					view: v_line_comment {
						derived_table: {
							sql:
								SELECT 1 AS id
								UNION -- distinct
								SELECT 2 AS id
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});

		it('should error on bare UNION in derived_table or sql_table_name', () => {
			const project = parseProject(`
				model: my_model {
					view: v_dt {
						derived_table: {
							sql:
								SELECT id FROM a
								UNION
								SELECT id FROM b
							;;
						}
					}
					view: v_subquery {
						sql_table_name: (SELECT id FROM a UNION SELECT id FROM b) ;;
					}
				}
			`);
			expect(errorMessages(rule(project))).toHaveLength(2);
		});

		it('should ignore UNION in string literals, comments, and identifiers', () => {
			const project = parseProject(`
				model: my_model {
					view: v_safe {
						derived_table: {
							sql:
								-- UNION SELECT 1
								SELECT 'UNION' AS label, union_id FROM t
							;;
						}
					}
				}
			`);
			expect(errorMessages(rule(project))).toEqual([]);
		});
	});
});
