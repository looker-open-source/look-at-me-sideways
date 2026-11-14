/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const {parse} = require('lookml-parser');

const F9 = {rule: 'F9'};
const error = {level: 'error'};

describe('Rules', () => {
	describe('F9', () => {
		it('should pass concise un-labeled field names', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: order_id { type: number }
				measure: total_amount { type: sum }
			} }`));
			expect(result).not.toContainMessage({...F9, ...error});
		});

		it('should pass concise field labels even when name is long', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: very_long_internal_column_name_for_status {
					label: "Order Status"
					type: string
				}
			} }`));
			expect(result).not.toContainMessage({...F9, ...error});
		});

		it('should pass hidden fields even when name or label is long', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: very_long_internal_column_name_for_status {
					label: "Very Long Internal Column Name For Status"
					hidden: yes
					type: string
				}
			} }`));
			expect(result).not.toContainMessage({...F9, ...error});
		});

		it('should fail long un-labeled field names', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: customer_lifetime_gross_revenue_before_discounts {
					type: number
				}
			} }`));
			expect(result).toContainMessage({...F9, ...error});
		});

		it('should fail long field labels', () => {
			let result = rule(parse(`model: m { view: v {
				measure: total_rev {
					label: "Total Gross Revenue After Discounts and Refunds"
					type: sum
				}
			} }`));
			expect(result).toContainMessage({...F9, ...error});
		});

		it('should respect custom maxLength in manifest rule options', () => {
			let result = rule(parse(`
				manifest: {
					rule: F9 {
						options: {
							maxLength: 10
						}
					}
				}
				model: m { view: v {
					dimension: order_status { type: string }
				} }
			`));
			expect(result).toContainMessage({...F9, ...error});

			let passResult = rule(parse(`
				manifest: {
					rule: F9 {
						options: {
							maxLength: 50
						}
					}
				}
				model: m { view: v {
					dimension: customer_lifetime_gross_revenue_before_discounts { type: number }
				} }
			`));
			expect(passResult).not.toContainMessage({...F9, ...error});
		});
	});
});
