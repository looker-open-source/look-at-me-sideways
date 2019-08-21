/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/t2-10.js');
const {parse} = require('lookml-parser');


describe('Rules', () => {
	describe('T2+', () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let warning = {level: 'warning'};
		let exempt = {exempt: expect.any(String)};
		let r = {
			pkColumnsRequired: {rule: 'T2'},
			pkColumnNaming: {rule: 'T3'},
			pkColumnsFirst: {rule: 'T4'},
			groupedQueries: {rule: 'T5'},
			ungroupedQueries: {rule: 'T6'},
			continueWithWindow: {rule: 'T7'},
			pkSeparator: {rule: 'T8'},
			singleColumnExemption: {rule: 'T9'},
			starFromSingleTableExemption: {rule: 'T10'},
		};

		it('should not error if there are no files', () => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`files:{} files:{}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for a view with no table', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { dimension: foo {} }
			}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for plain table-reference sql_table_name', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { sql_table_name: my_schema.tbl ;; }
			}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should error for bad sql_table_name-based transformations', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { sql_table_name: (
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				) ;; }
			}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
		});

		it('should error for bad derived_table-based transformations', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				;; } }
			}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
		});


		it('should exempt bad derived_table-based transformations with view exemptions', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { 
					rule_exemptions: {T2: "Forget PKs"}
					derived_table: { sql:
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				;; } }
			}`));
			expect(result).toContainMessage({...exempt, ...r.pkColumnsRequired});
		});


		it('should exempt bad derived_table-based transformations with project exemptions', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { 
					derived_table: { sql:
					SELECT account_id, COUNT(*)
					FROM users
					GROUP BY 1
				;; } }
			}
			file: manifest {rule_exemptions: {T2: "Forget PKs"}}`));
			expect(result).toContainMessage({...exempt, ...r.pkColumnsRequired});
		});

		it('should info and not warn/error for single-column transformations', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT MAX(id)
					FROM sessions
				;; } }
			}`));
			expect(result).toContainMessage({...info, ...r.singleColumnExemption});
			expect(result).not.toContainMessage({...warning});
			expect(result).not.toContainMessage({...error});
		});

		it('should info and not warn/error for single-table SELECT *+ transformations', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT *, DATE_DIFF(seconds, start, end) as duration
					FROM sessions
				;; } }
			}`));
			expect(result).toContainMessage({...info, ...r.starFromSingleTableExemption});
			expect(result).not.toContainMessage({...warning});
			expect(result).not.toContainMessage({...error});
		});

		it('should not warn/error for a transformation containing correct pk columns', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						pk2_tenant_id, 
						pk2_user_id,
						---
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}`));
			expect(result).not.toContainMessage({...warning});
			expect(result).not.toContainMessage({...error});
		});

		it('should error for a transformation containing misnumbered pk columns', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						pk1_tenant_id, 
						pk2_user_id,
						---
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}`));
			expect(result).toContainMessage({...error, ...r.pkNamingConvention});
		});

		it('should error for a transformation where pk columns aren\'t first', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						pk2_tenant_id,
						MAX(start) as last_login,
						---
						pk2_user_id
					FROM sessions
					GROUP BY 1,3
				;; } }
			}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsFirst});
		});

		it('should warn for a derived table missing the pk separator', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						pk2_tenant_id, 
						pk2_user_id,
						MAX(start) as last_login
					FROM sessions
					GROUP BY 1,2
				;; } }
			}`));
			expect(result).toContainMessage({...warning, ...r.pkSeparator});
		});

		it('should warn (and suggest an exemption) for ungrouped trasformations that it can\'t enforce', () => {
			let result = rule(parse(`files:{} files:{
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
			}`));
			expect(result).toContainMessage({...warning, ...r.ungroupedQueries});
		});

		it('should error for grouped transformations that don\'t use a group as the first PK', () => {
			let result = rule(parse(`files:{} files:{
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
			}`));
			expect(result).toContainMessage({...error, ...r.groupedQueries});
		});

		it('should error for grouped transformations that don\'t use all groupings in PK and don\'t continue', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						sessions.user_id as pk1_user_id,
						---
						session.id
					FROM sessions
					GROUP BY 1,2
				;; } }
			}`));
			expect(result).toContainMessage({...error, ...r.continueWithWindow});
		});

		it('should error for grouped transformations that don\'t use all groupings in PK and continue with a non-window column', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						sessions.user_id as pk2_user_id,
						SUBSTR(sessions.user_id,1,10) as pk2_tenant_id,
						---
						session.id
					FROM sessions
					GROUP BY 1,3
				;; } }
			}`));
			expect(result).toContainMessage({...error, ...r.continueWithWindow});
		});

		it('should not warn/error for ordinal-grouped transformations that don\'t use all groupings in PK but continue with a window column', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						user_id as pk2_user_id,
						ROW_NUMBER() OVER (PARTITION BY user_id) as pk2_date_sequence,
						---
						date
					FROM sessions
					GROUP BY 1,3
				;; } }
			}`));
			expect(result).not.toContainMessage({...warning});
			expect(result).not.toContainMessage({...error});
		});

		it('should not warn/error for expression-grouped transformations that don\'t use all groupings in PK but continue with a window column', () => {
			let result = rule(parse(`files:{} files:{
				view: foo { derived_table: { sql:
					SELECT
						user_id as pk2_user_id,
						ROW_NUMBER() OVER (PARTITION BY user_id) as pk2_date_sequence,
						---
						date
					FROM sessions
					GROUP BY user_id, date
				;; } }
			}`));
			expect(result).not.toContainMessage({...warning});
			expect(result).not.toContainMessage({...error});
		});

		it('should error for each sequential subquery in a transformation', () => {
			let result = rule(parse(`files:{} files:{
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
			}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
			expect(result).toContainMessage({...error, ...r.pkNamingConvention});
		});

		it('should error for each nested subquery in a transformation', () => {
			let result = rule(parse(`files:{} files:{
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
			}`));
			expect(result).toContainMessage({...error, ...r.pkColumnsRequired});
			expect(result).toContainMessage({...error, ...r.pkNamingConvention});
		});
	});
});
