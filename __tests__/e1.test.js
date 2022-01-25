/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/e1.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E1', () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let e1 = {rule: 'E1'};


		it('should pass if there are no models', () => {
			let result = rule(parse(`view: foo{}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if there are no joins', () => {
			let result = rule(parse(`model: foo {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass for joins with no sql_on/sql', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: status {
						relationship: many_to_many
						type: cross
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass for joins with no field-like strings in sql', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: order_fields {
						relationship: one_to_one
						sql: ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});


		it('should pass for joins with no field-like strings in sql_on', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: payments {
						relationship: one_to_one
						type: full_outer
						sql: FALSE ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass for joins where all (at least one) field references use ${} in sql_on', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: one_to_many
						sql_on: \${orders.1pk_user_id} = \${users.id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass for joins where all (at least one) field references use ${} in sql', () => {
			// Note: This users/_users stuff is due to a limitation in Looker and reflect actual usage
			let result = rule(parse(`model: foo {
				explore: orders {
					join: _users {
						from: users
						relationship: one_to_many
						sql: LEFT JOIN \${users.SQL_TABLE_NAME} as _users
						  ON \${orders.1pk_user_id} = \${users.id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should error for joins with bare field references in sql_on', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: one_to_many
						sql_on: \${orders.1pk_user_id} = \${_users.id}
						  AND orders.account_id = \${_users.account_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...error});
		});

		it('should error for joins with bare field references in sql', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: one_to_many
						sql: LEFT JOIN analytics.users AS _users
						  ON \${orders.1pk_user_id} = \${_users.id}
						  AND \${orders.account_id} = \${_users.account_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...error});
		});

		it('should pass if bare references are found inside liquid', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: {% if users.created_week._in_query %}
									users.created_week=orders_smry_week.week
								{% else %}
									users.id=orders.user_id
								{% endif %} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should error if bare references are found outside liquid', () => {
			let result = rule(parse(`model: foo {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: {% if users.created_week._in_query %}
									users.created_week=orders_smry_week.week
								{% else %}
									users.id=orders.user_id
								{% endif %}
								AND orders.account_id = \${_users.account_id
								;;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...error});
		});

		it('should not error for `SAFE.*` field-like strings', () => {
			// Note: In BigQuery, these are functions, not fields. Example function only, actual usage may be different
			let result = rule(parse(`model: foo {
				explore: orders {
					join: _users {
						from: users
						relationship: one_to_many
						sql: LEFT JOIN \${users.SQL_TABLE_NAME} as _users
						  ON \${orders.1pk_user_id} = SAFE.CAST(\${users.id} AS integer);;
					}
				}
			}`));
			expect(result).toContainMessage({...e1, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		// TODO Test exemptions
	});
});
