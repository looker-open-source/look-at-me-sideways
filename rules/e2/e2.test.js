/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../../lib/expect-to-contain-message');

const rule = require('./index.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E2', () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let e2 = {rule: 'E2'};

		it('should pass if there are no models', () => {
			let result = rule(parse(`view: foo{}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if there are no joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass for many_to_many joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_many
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a many_to_one join correctly uses a 1pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk1_user_id} = \${orders.user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a many_to_one join correctly uses an implicit 1pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk_user_id} = \${orders.user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a many_to_one join correctly uses a 1pk equality constraint in reverse, or across lines', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${orders.user_id}
						=
						\${users.pk1_user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a many_to_one join correctly uses a 2pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id}
							AND \${users.pk2_tenant_id} = \${orders.pk2_tenant_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should error if a many_to_one join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.id} = \${orders.user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a many_to_one join uses PK dimensions, but not on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.id} = \${orders.pk1_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a many_to_one join uses an implicit pk1 dimensions, but not on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.id} = \${orders.pk_order_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a many_to_one join has mismatched column numbers on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk1_user_id} = \${orders.user_id}
							AND \${users.pk2_tenant_id} = \${orders.tenant_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a many_to_one join does not reference enough PK dimensions on the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a many_to_one join does not reference all unique PK dimensions from the "one" view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id}
							AND \${users.pk2_user_id} = \${orders.user_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a many_to_one does not involve PK dimensions on the "one" view in an equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: subscription {
					join: date {
						relationship: many_to_one
						sql_on: \${date.pk1_date} >= \${subscription.start_date}
							AND \${date.pk1_date} <= \${subscription.start_date};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});


		it('should error if a many_to_one join uses equality constraints with an OR', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.pk2_user_id} = \${orders.user_id}
							AND \${users.pk2_tenant_id} = \${orders.pk2_tenant_id}
							OR \${users.pk2_tenant_id} IS NULL;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});


		it('should pass if a one_to_one join correctly uses a 1pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: user {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk1_user_id} = \${users.pk1_user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass if a one_to_one join correctly uses a 2pk equality constraint', () => {
			let result = rule(parse(`model: m {
				explore: invitations {
					join: memberships {
						relationship: one_to_one
						sql_on: \${memberships.pk2_user_id} = \${invitations.pk2_user_id}
							AND \${memberships.pk2_group_id} = \${invitations.pk2_group_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});


		it('should error if a one_to_one join uses no PK dimensions', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.user_id} = \${users.id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a one_to_one join uses PK dimensions, but not on the "left"/"explore" side', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.user_id} = \${users.pk1_user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a one_to_one join uses PK dimensions, but not on the "right"/"join" side', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk1_user_id} = \${users.user_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a one_to_one join has mismatched column numbers on the  "left"/"explore" side', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk1_user_id} = \${users.pk2_user_id}
							AND \${user_summaries.pk2_tenant_id} = \${users.pk2_tenant_id} ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a one_to_one join does not reference enough PK dimensions on the "left"/"explore" view', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk2_user_id} = \${users.pk2_user_id}
							AND \${user_summaries.pk2_user_id} = \${users.pk2_tenant_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should error if a one_to_one join does not reference enough PK dimensions on the "right"/"join" view', () => {
			let result = rule(parse(`model: m {
				explore: users {
					join: user_summaries {
						relationship: one_to_one
						sql_on: \${user_summaries.pk2_user_id} = \${users.pk2_user_id}
							AND \${user_summaries.pk2_tenant_id} = \${users.pk2_user_id};;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...error});
		});

		it('should pass if a one_to_one join does not actually result in a SQL JOIN', () => {
			let result = rule(parse(`model: m {
				explore: invitations {
					join: invitation_extra_fields {
						relationship: one_to_one
						sql: ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass with constraints against a literal value (one_to_one)', () => {
			let result = rule(parse(`model: m {
				explore: entity {
					join: eav {
						relationship: one_to_one
						sql_on: \${entity.pk1_id} = \${eav.pk2_id} AND \${eav.pk2_attribute} = 'TEST' ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass with constraints against a literal value (one_to_many)', () => {
			let result = rule(parse(`model: m {
				explore: entity {
					join: eav {
						relationship: one_to_many
						sql_on: \${entity.pk1_id} = \${eav.pk3_id} AND \${eav.pk3_category} = 'TEST' ;;
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
			expect(result).not.toContainMessage(error);
		});

		it('should pass for UNNEST joins via sql', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: nested {
						sql: LEFT JOIN UNNEST(nested) ;;
						relationship: many_to_one
					}
					join: items {
						sql: LEFT JOIN UNNEST(\${orders.items}) AS items ;;
						relationship: one_to_many
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
		});

		it('should pass for UNNEST joins via join.sql_table_name', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: nested {
						sql_table_name: UNNEST(\${orders.nested}) ;;
						sql_on: TRUE ;;
						relationship: many_to_one
					}
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
		});

		it('should pass in default strict_mode:no when primary_key:yes dimension is constrained', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						sql_on: \${users.id} = \${orders.user_id} ;;
					}
				}
				view: users {
					dimension: id { primary_key: yes }
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
		});

		it('should pass in default strict_mode:no when composite primary_key:yes constituent columns are constrained', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: user_tenants {
						relationship: many_to_one
						sql_on: \${user_tenants.user_id} = \${orders.user_id} AND \${user_tenants.tenant_id} = \${orders.tenant_id} ;;
					}
				}
				view: user_tenants {
					dimension: pk {
						primary_key: yes
						sql: CONCAT(\${user_id}, '-', \${tenant_id}) ;;
					}
					dimension: user_id { sql: \${TABLE}.user_id ;; }
					dimension: tenant_id { sql: \${TABLE}.tenant_id ;; }
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
		});

		it('should pass in default strict_mode:no when DT GROUP BY (named or positional) or SELECT DISTINCT columns are constrained', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: user_summary {
						relationship: many_to_one
						sql_on: \${user_summary.user_id} = \${orders.user_id} AND \${user_summary.region} = \${orders.region} ;;
					}
					join: distinct_dates {
						relationship: many_to_one
						sql_on: \${distinct_dates.dt} = \${orders.created_date} ;;
					}
				}
				view: user_summary {
					derived_table: {
						sql: SELECT user_id, region, COUNT(*) AS cnt FROM raw.orders GROUP BY 1, 2 ;;
					}
					dimension: user_id { sql: \${TABLE}.user_id ;; }
					dimension: region { sql: \${TABLE}.region ;; }
				}
				view: distinct_dates {
					derived_table: {
						sql: SELECT DISTINCT dt FROM raw.dates ;;
					}
					dimension: dt { sql: \${TABLE}.dt ;; }
				}
			}`));
			expect(result).toContainMessage({...e2, ...info});
			expect(result).not.toContainMessage(error);
		});

		it('should enforce PK naming convention when strict_mode:yes is set in manifest', () => {
			let result = rule(parse(`
				manifest: {
					rule: E2 { options: { strict_mode: yes } }
				}
				model: m {
					explore: orders {
						join: users {
							relationship: many_to_one
							sql_on: \${users.id} = \${orders.user_id} ;;
						}
					}
					view: users {
						dimension: id { primary_key: yes }
					}
				}
			`));
			expect(result).toContainMessage({...e2, ...error});
		});
	});
});
