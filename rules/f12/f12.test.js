/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const {parse} = require('lookml-parser');

const F12 = {rule: 'F12'};
const error = {level: 'error'};

describe('Rules', () => {
	describe('F12', () => {
		it('should pass when aliases do not conflict', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: id { alias: [order_id, legacy_id] }
				measure: total { alias: [sum_amount] }
				dimension_group: created {
					type: time
					timeframes: [date, week]
					alias: [order_created]
				}
			} }`));
			expect(result).not.toContainMessage({...F12, ...error});
		});

		it('should pass when the same alias or field name is used in different views', () => {
			let result = rule(parse(`model: m {
				view: v1 {
					dimension: a { alias: [shared_alias] }
				}
				view: v2 {
					dimension: shared_alias {}
					dimension: b { alias: [shared_alias_2] }
				}
			}`));
			expect(result).not.toContainMessage({...F12, ...error});
		});

		it('should error when an alias conflicts with an existing dimension, measure, filter, or parameter', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: existing_dim {}
				measure: existing_meas {}
				filter: existing_filt {}
				parameter: existing_param {}
				dimension: d1 { alias: [existing_dim] }
				dimension: d2 { alias: [existing_meas] }
				dimension: d3 { alias: [existing_filt] }
				dimension: d4 { alias: [existing_param] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d1'});
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d2'});
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d3'});
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d4'});
		});

		it('should error when a field aliases its own name', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: foo { alias: [foo] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:foo'});
		});

		it('should error when multiple fields share the same alias', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: a { alias: [legacy_x] }
				measure: b { alias: [legacy_x] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:a'});
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/measure:b'});
		});

		it('should error when a single field lists a duplicate alias', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: a { alias: [dup, dup] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:a'});
		});

		it('should error when a dimension alias conflicts with an expanded time dimension_group field', () => {
			let result = rule(parse(`model: m { view: v {
				dimension_group: created {
					type: time
					timeframes: [date, week]
				}
				dimension: d { alias: [created_date] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d'});
		});

		it('should error when a dimension alias conflicts with a default-timeframe dimension_group field', () => {
			let result = rule(parse(`model: m { view: v {
				dimension_group: updated {}
				dimension: d { alias: [updated_raw] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d'});
		});

		it('should error when a dimension alias conflicts with an expanded duration dimension_group field', () => {
			let result = rule(parse(`model: m { view: v {
				dimension_group: tenure {
					type: duration
					intervals: [day, month]
				}
				dimension: d { alias: [days_tenure] }
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension:d'});
		});

		it('should error when a dimension_group alias conflicts with a dimension or another dimension_group alias', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: old_created_date {}
				dimension_group: created {
					type: time
					timeframes: [date, week]
					alias: [old_created, shared_dg]
				}
				dimension_group: updated {
					type: time
					timeframes: [week]
					alias: [shared_dg]
				}
			} }`));
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension_group/created'});
			expect(result).toContainMessage({...F12, ...error, location: 'model:m/view:v/dimension_group/updated'});
		});
	});
});
