/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const {parse} = require('lookml-parser');

const F11 = {rule: 'F11'};
const error = {level: 'error'};

describe('Rules', () => {
	describe('F11', () => {
		it('should pass when string fields use -NULL and number fields use NOT NULL', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: email {}
				dimension: amount { type: number }
				measure: c1 {
					type: count
					filters: [email: "-NULL", amount: "NOT NULL"]
				}
			} }`));
			expect(result).not.toContainMessage({...F11, ...error});
		});

		it('should error when a string field uses NOT NULL', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: email { type: string }
				measure: c1 {
					type: count
					filters: [email: "NOT NULL"]
				}
			} }`));
			expect(result).toContainMessage({...F11, ...error});
		});

		it('should error when a number field uses -NULL', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: amount { type: number }
				measure: c1 {
					type: count
					filters: [amount: "-NULL"]
				}
			} }`));
			expect(result).toContainMessage({...F11, ...error});
		});

		it('should resolve cross-view field references in measure filters', () => {
			let result = rule(parse(`model: m {
				view: users {
					dimension: email { type: string }
				}
				view: orders {
					measure: c1 {
						type: count
						filters: [users.email: "NOT NULL"]
					}
				}
			}`));
			expect(result).toContainMessage({...F11, ...error});
		});

		it('should error when filtering on a raw timeframe from a dimension_group', () => {
			let result = rule(parse(`model: m { view: v {
				dimension_group: created {
					type: time
					timeframes: [raw, date, time]
				}
				measure: c1 {
					type: count
					filters: [created_raw: "-NULL"]
				}
			} }`));
			expect(result).toContainMessage({...F11, ...error});
		});
	});
});
