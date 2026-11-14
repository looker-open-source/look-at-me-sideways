/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const {parse} = require('lookml-parser');

const E8 = {rule: 'E8'};
const error = {level: 'error'};

describe('Rules', () => {
	describe('E8', () => {
		it('should pass when always_filter and conditionally_filter use valid null filters', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					always_filter: {
						filters: [orders.status: "-NULL"]
					}
					conditionally_filter: {
						filters: [orders.amount: "NOT NULL"]
					}
				}
				view: orders {
					dimension: status { type: string }
					dimension: amount { type: number }
				}
			}`));
			expect(result).not.toContainMessage({...E8, ...error});
		});

		it('should error when always_filter uses NOT NULL on a string field', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					always_filter: {
						filters: [orders.status: "NOT NULL"]
					}
				}
				view: orders {
					dimension: status {}
				}
			}`));
			expect(result).toContainMessage({...E8, ...error});
		});

		it('should error when conditionally_filter uses -NULL on a numeric field (including via join/from)', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: buyers {
						from: users
					}
					conditionally_filter: {
						filters: [buyers.age: "-NULL"]
					}
				}
				view: users {
					dimension: age { type: number }
				}
			}`));
			expect(result).toContainMessage({...E8, ...error});
		});

		it('should error when always_filter filters on a raw timeframe', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					always_filter: {
						filters: [orders.created_raw: "NOT NULL"]
					}
				}
				view: orders {
					dimension_group: created {
						type: time
					}
				}
			}`));
			expect(result).toContainMessage({...E8, ...error});
		});
	});
});
