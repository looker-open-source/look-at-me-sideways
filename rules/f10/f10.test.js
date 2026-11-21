/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const {parse} = require('lookml-parser');

const F10 = {rule: 'F10'};
const error = {level: 'error'};

describe('Rules', () => {
	describe('F10', () => {
		it('should pass when fields do not use suggest_explore or suggest_dimension', () => {
			let result = rule(parse(`model: m {
				view: v {
					dimension: id { type: number }
				}
			}`));
			expect(result).not.toContainMessage({...F10, ...error});
		});

		it('should pass when suggest_explore and qualified suggest_dimension are available in the model', () => {
			let result = rule(parse(`model: m {
				explore: customer_analytics {
					from: customers
				}
				view: customers {
					dimension: customer_name { type: string }
				}
				view: orders {
					dimension: customer_id {
						type: number
						suggest_explore: customer_analytics
						suggest_dimension: customer_analytics.customer_name
					}
				}
			}`));
			expect(result).not.toContainMessage({...F10, ...error});
		});

		it('should pass when suggest_dimension targets a joined view and dimension_group timeframe', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: customers {
						sql_on: \${orders.customer_id} = \${customers.id} ;;
					}
				}
				view: customers {
					dimension: id { type: number }
					dimension_group: joined {
						type: time
						timeframes: [date, week]
					}
				}
				view: orders {
					dimension: customer_id {
						type: number
						suggest_explore: orders
						suggest_dimension: customers.joined_date
					}
				}
			}`));
			expect(result).not.toContainMessage({...F10, ...error});
		});

		it('should pass when unqualified suggest_dimension exists in the same view', () => {
			let result = rule(parse(`model: m {
				view: orders {
					dimension: status { type: string }
					filter: status_filter {
						suggest_dimension: status
					}
				}
			}`));
			expect(result).not.toContainMessage({...F10, ...error});
		});

		it('should error when suggest_explore does not exist in the model', () => {
			let result = rule(parse(`model: m {
				view: orders {
					dimension: customer_id {
						type: number
						suggest_explore: missing_explore
						suggest_dimension: customers.customer_name
					}
				}
			}`));
			expect(result).toContainMessage({...F10, ...error});
		});

		it('should error when suggest_dimension view is not joined in suggest_explore', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
				view: customers {
					dimension: customer_name { type: string }
				}
				view: orders {
					dimension: customer_id {
						type: number
						suggest_explore: orders
						suggest_dimension: customers.customer_name
					}
				}
			}`));
			expect(result).toContainMessage({...F10, ...error});
		});

		it('should error when suggest_dimension field does not exist in target view', () => {
			let result = rule(parse(`model: m {
				explore: customers {}
				view: customers {
					dimension: id { type: number }
				}
				view: orders {
					dimension: customer_id {
						type: number
						suggest_explore: customers
						suggest_dimension: customers.nonexistent
					}
				}
			}`));
			expect(result).toContainMessage({...F10, ...error});
		});

		it('should error when qualified suggest_dimension is used without suggest_explore and view is missing from an explore', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
				view: customers {
					dimension: customer_name { type: string }
				}
				view: orders {
					dimension: customer_id {
						type: number
						suggest_dimension: customers.customer_name
					}
				}
			}`));
			expect(result).toContainMessage({...F10, ...error});
		});

		it('should error when unqualified suggest_dimension does not exist in current view', () => {
			let result = rule(parse(`model: m {
				view: orders {
					filter: status_filter {
						suggest_dimension: missing_status
					}
				}
			}`));
			expect(result).toContainMessage({...F10, ...error});
		});
	});
});
