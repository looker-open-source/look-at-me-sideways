/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

const rule = require('./index.js');
const {parse} = require('lookml-parser');

function parseProject(lkml) {
	return parse(lkml, {conditionalCommentString: 'LAMS'});
}

function messagesFor(result, subRule) {
	return result.filter((m) => m.rule === subRule && m.level === 'error');
}

function errorMessages(result) {
	return result.filter((m) => m.level === 'error');
}

describe('Rules', () => {
	describe('T3', () => {
		it('should pass for views without a table or ephemeral derived tables', () => {
			const project = parseProject(`
				model: my_model {
					explore: e1 {}
					explore: e2 {}
					view: e1 {
						dimension: id { sql: 1 ;; }
					}
					view: e2 {
						derived_table: {
							sql: SELECT 1 AS id ;;
						}
						dimension: id { sql: \${TABLE}.id ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('should pass for table-backed views not used as the base of any non-hidden explore', () => {
			const project = parseProject(`
				model: my_model {
					explore: hidden_exp {
						hidden: yes
					}
					view: hidden_exp {
						sql_table_name: analytics.hidden_exp ;;
						dimension: id { sql: \${TABLE}.id ;; }
					}
					view: unexposed {
						sql_table_name: analytics.unexposed ;;
						dimension: id { sql: \${TABLE}.id ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('T3.1: should error when a sql_table_name view used as an explore base lacks required_filter and row-count test', () => {
			const project = parseProject(`
				model: my_model {
					explore: orders {}
					view: orders {
						sql_table_name: analytics.orders ;;
						dimension: id { sql: \${TABLE}.id ;; }
					}
				}
			`);
			const result = rule(project);
			expect(messagesFor(result, 'T3.1')).toHaveLength(1);
		});

		it('T3.1: should detect views referenced via explore.from or explore.view_name', () => {
			const project = parseProject(`
				model: my_model {
					explore: recent_orders {
						from: orders
					}
					view: orders {
						sql_table_name: analytics.orders ;;
						dimension: id { sql: \${TABLE}.id ;; }
					}
				}
			`);
			const result = rule(project);
			expect(messagesFor(result, 'T3.1')).toHaveLength(1);
		});

		it('T3.1: should pass when a table-backed view has a data test asserting a maximum row count', () => {
			const project = parseProject(`
				model: my_model {
					explore: countries {}
					view: countries {
						sql_table_name: ref.countries ;;
						dimension: code { sql: \${TABLE}.code ;; }
						measure: count { type: count }
					}
					test: small_table {
						explore_name: countries
						assert: max_rows {
							expression: \${countries.count} <= 500 ;;
						}
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('T3.2: should error when required_filter does not resolve to a field in the view', () => {
			const project = parseProject(`
				model: my_model {
					explore: orders {}
					view: orders {
						#LAMS required_filter: nonexistent_date
						sql_table_name: analytics.orders ;;
						dimension: id { sql: \${TABLE}.id ;; }
					}
				}
			`);
			const result = rule(project);
			expect(messagesFor(result, 'T3.2')).toHaveLength(1);
		});

		it('T3.2 & T3.3: should resolve dimension_group timeframes and pass for sql_table_name view', () => {
			const project = parseProject(`
				model: my_model {
					explore: orders {}
					view: orders {
						#LAMS required_filter: created_date
						sql_table_name: analytics.orders ;;
						dimension_group: created {
							type: time
							timeframes: [date, week]
							sql: \${TABLE}.created_at ;;
						}
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('T3.3: should error when PDT first sortkeys/indexes/partition_keys does not match required_filter sql', () => {
			const project = parseProject(`
				model: my_model {
					explore: events {}
					view: events {
						#LAMS required_filter: user_id
						derived_table: {
							sql: SELECT event_date, user_id FROM raw.events ;;
							persist_for: "24 hours"
							partition_keys: ["event_date"]
						}
						dimension: user_id { sql: \${TABLE}.user_id ;; }
						dimension: event_date { sql: \${TABLE}.event_date ;; }
					}
				}
			`);
			const result = rule(project);
			expect(messagesFor(result, 'T3.3')).toHaveLength(1);
		});

		it('T3.3: should pass when PDT first sortkeys, indexes, or partition_keys matches required_filter sql', () => {
			const project = parseProject(`
				model: my_model {
					explore: events {}
					explore: sessions {}
					explore: logs {}
					view: events {
						#LAMS required_filter: event_date
						derived_table: {
							sql: SELECT event_date FROM raw.events ;;
							persist_for: "24 hours"
							partition_keys: ["event_date", "user_id"]
						}
						dimension: event_date { sql: \${TABLE}.event_date ;; }
					}
					view: sessions {
						#LAMS required_filter: session_date
						derived_table: {
							sql: SELECT session_date FROM raw.sessions ;;
							persist_for: "24 hours"
							sortkeys: ["session_date"]
						}
						dimension: session_date { sql: \${TABLE}.session_date ;; }
					}
					view: logs {
						#LAMS required_filter: log_date
						derived_table: {
							sql: SELECT log_date FROM raw.logs ;;
							persist_for: "24 hours"
							indexes: ["log_date"]
						}
						dimension: log_date { sql: \${TABLE}.log_date ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});

		it('T3.3: should skip sql_create and create_process PDTs', () => {
			const project = parseProject(`
				model: my_model {
					explore: custom_pdt {}
					view: custom_pdt {
						#LAMS required_filter: created_date
						derived_table: {
							sql_create: CREATE TABLE \${SQL_TABLE_NAME} AS SELECT 1 AS created_date ;;
							persist_for: "24 hours"
							indexes: ["other_col"]
						}
						dimension: created_date { sql: \${TABLE}.created_date ;; }
					}
				}
			`);
			const result = rule(project);
			expect(errorMessages(result)).toEqual([]);
		});
	});
});
