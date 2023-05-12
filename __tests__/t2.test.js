/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/t2.js');
const {parse} = require('lookml-parser');


describe('Rules', () => {
	describe('T2', () => {
		let verbose = {level: 'verbose'};
		let error = {level: 'error'};
		let r = {
			umbrellaRuleT2: {rule: 'T2'},
			pkColumnsRequired: {rule: 'T2.1'}, // Changed from T2 -> T3 since T2 is a overview rule that represents all of T2-T10
			pkColumnNaming: {rule: 'T2.1'},
			pkColumnsFirst: {rule: 'T2.2'},
			groupedQueries: {rule: 'T2.3'},
			ungroupedQueries: {rule: 'T2.4'},
			continueWithWindow: {rule: 'T2.5'},
			pkSeparator: {rule: 'T2.6'},
			singleColumnExemption: {rule: 'T2.7'},
			starFromSingleTableExemption: {rule: 'T2.8'},
		};

		it('should not error if there are no files', () => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`model: { myexplore.explore: {}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for a view with no table', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { dimension: foo {} }
			}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for plain table-reference sql_table_name', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { sql_table_name: my_schema.tbl ;; }
			}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should error for bad sql_table_name-based transformations', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { sql_table_name: (
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				) ;; }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
		});

		it('should error for bad derived_table-based transformations', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
		});


		it('should exempt bad derived_table-based transformations with view exemptions', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { 
					rule_exemptions: {T2: "Forget PKs"}
					derived_table: { sql:
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				;; } }
			}}`));
			expect(result).not.toContainMessage({...error, ...r.umbrellaRuleT2});
			expect(result).not.toContainMessage({...error, ...r.pkColumnsRequired});
		});

		// Note: Since project-level exemptions have been moved ahead of rule application for performance/short-circuting,
		//		 this test is not currently representative of anything. May want to re-enable eventually by double checking
		//		 for project-level exemptions
		// it('should exempt bad derived_table-based transformations with project exemptions', () => {
		// 	let result = rule(parse(`model: { my_model: {
		// 		view: foo {
		// 			derived_table: { sql:
		// 			SELECT account_id, COUNT(*)
		// 			FROM users
		// 			GROUP BY 1
		// 		;; } }
		// 	}
		// 	manifest: {rule_exemptions: {T2: "Forget PKs"}}`));
		// 	expect(result).not.toContainMessage({...error, ...r.umbrellaRuleT2});
		// 	expect(result).not.toContainMessage({...error, ...r.pkColumnsRequired});
		// });

		it('should not error/error for single-column transformations', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT MAX(id)
					FROM sessions
				;; } }
			}}`));
			expect(result).toContainMessage({...verbose, ...r.singleColumnExemption});
			expect(result).not.toContainMessage({...error});
		});

		it('should not error/error for single-table SELECT *+ transformations', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT *, DATE_DIFF(seconds, start, end) as duration
					FROM sessions
				;; } }
			}}`));
			expect(result).toContainMessage({...verbose, ...r.starFromSingleTableExemption});
			expect(result).not.toContainMessage({...error});
		});

		it('should not error/error for a transformation containing correct pk columns', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						pk2_tenant_id, 
						pk2_user_id,
						---
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should error for a transformation containing misnumbered pk columns', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						pk1_tenant_id, 
						pk2_user_id,
						---
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkNamingConvention});
		});

		it('should error for a transformation where pk columns aren\'t first', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						pk2_tenant_id,
						MAX(start) as last_login,
						---
						pk2_user_id
					FROM sessions
					GROUP BY 1,3
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsFirst});
		});

		it('should error for a derived table missing the pk separator', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						pk2_tenant_id, 
						pk2_user_id,
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkSeparator});
		});

		it('should verbose message for ungrouped trasformations that it can\'t enforce', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						session.id as pk2_session_id, 
						ROW_NUMBER() OVER (PARTITION BY pk2_session_id) AS pk2_session_sequence,
						---
						event.ts,
						event.type
					FROM sessions
					LEFT JOIN events
					  ON events.session_id = sessions.id
				;; } }
			}}`));
			expect(result).toContainMessage({...verbose, ...r.ungroupedQueries});
		});

		it('should error for grouped transformations that don\'t use a group as the first PK', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						ROW_NUMBER() OVER (PARTITION BY pk2_session_id) AS pk2_session_sequence,
						session.id as pk2_session_id,
						---
						event.ts,
						event.type
					FROM sessions
					LEFT JOIN events
					  ON events.session_id = sessions.id
					GROUP BY session.id, events.id
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.groupedQueries});
		});

		it('should error for grouped transformations that don\'t use all groupings in PK and don\'t continue', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						sessions.user_id as pk1_user_id,
						---
						session.id
					FROM sessions
					GROUP BY 1,2
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.continueWithWindow});
		});

		it('should error for grouped transformations that don\'t use all groupings in PK and continue with a non-window column', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						sessions.user_id as pk2_user_id,
						SUBSTR(sessions.user_id,1,10) as pk2_tenant_id,
						---
						session.id
					FROM sessions
					GROUP BY 1,3
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.continueWithWindow});
		});

		it('should not error/error for ordinal-grouped transformations that don\'t use all groupings in PK but continue with a window column', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						user_id as pk2_user_id,
						ROW_NUMBER() OVER (PARTITION BY user_id) as pk2_date_sequence,
						---
						date
					FROM sessions
					GROUP BY 1,3
				;; } }
			}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error/error for expression-grouped transformations that don\'t use all groupings in PK but continue with a window column', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						user_id as pk2_user_id,
						ROW_NUMBER() OVER (PARTITION BY user_id) as pk2_date_sequence,
						---
						date
					FROM sessions
					GROUP BY user_id, date
				;; } }
			}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should error for each sequential subquery in a transformation', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					WITH missing AS (
						SELECT account_id, COUNT(*)
						FROM users
						GROUP BY 1
					), 
					misnumbered AS (
						SELECT
							pk1_tenant_id, 
							pk2_user_id,
							---
							MAX(start) as last_login
						FROM sessions
						GROUP BY 1,2
					)
					SELECT "foo" as bar
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
			expect(result).toContainMessage({...error, ...r.pkNamingConvention});
		});

		it('should not error if --- separator is used multiple times with leading commas', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					WITH step_1 AS (
						SELECT
							account_id AS pk1_account_id
							---
							, COUNT(*)
						FROM users
						GROUP BY 1
					),
					step_2 AS (
						SELECT
							pk2_tenant_id
							, pk2_user_id
							---
							, MAX(start) as last_login
						FROM sessions
						GROUP BY 1,2
					)

					SELECT "foo" as bar
				;; } }
			}}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should error for each nested subquery in a transformation', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT "foo" as bar
					FROM (
						SELECT account_id, COUNT(*)
						FROM (
							SELECT
								pk1_tenant_id, 
								pk2_user_id,
								---
								MAX(start) as last_login
							FROM sessions
							GROUP BY 1,2
						) as minumbered
						GROUP BY 1
					) as missing
				;; } }
			}}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
			expect(result).toContainMessage({...error, ...r.pkNamingConvention});
		});

		it('should not error based on SQL-like syntax in strings anywhere', () => {
			let result = rule(parse(`model: { my_model: {
				view: foo { derived_table: { sql:
					SELECT
						'String 1' as pk2_tenant_id, 
						'(SELECT pk5_foo, MAX(x) FROM bar)' as pk2_user_id,
						---
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}}`));
			expect(result).not.toContainMessage({...error});
		});
	});
});
