/* Copyright (c) 2026 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */

require('../../lib/expect-to-contain-message');
const rule = require('./index.js');
const {parse} = require('lookml-parser');

const F8 = {rule: 'F8'};
const error = {level: 'error'};

describe('Rules', () => {
	describe('F8', () => {
		it('should pass when value_format_name is set', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: user_id { type: number value_format_name: id }
				measure: revenue_usd { type: number value_format_name: usd_0 }
			} }`));
			expect(result).not.toContainMessage({...F8, ...error});
		});

		it('should pass when value_format is set', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: user_id { type: number value_format: "0" }
			} }`));
			expect(result).not.toContainMessage({...F8, ...error});
		});

		it('should pass when field is hidden', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: user_id { type: number hidden: yes }
				dimension: amount_usd { type: number hidden: yes }
			} }`));
			expect(result).not.toContainMessage({...F8, ...error});
		});

		it('should pass when field type is not number', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: user_id { type: string }
				measure: total_usd { type: sum }
			} }`));
			expect(result).not.toContainMessage({...F8, ...error});
		});

		it('should pass for type:number fields without ID or USD keywords', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: width { type: number }
				dimension: paid_count { type: number label: "Paid Count" description: "Number of items" }
			} }`));
			expect(result).not.toContainMessage({...F8, ...error});
		});

		it('should suggest value_format_name: id for numeric IDs by primary_key, name, label, or description', () => {
			let result = rule(parse(`model: m { view: v {
				dimension: account_num { type: number primary_key: yes }
				dimension: user_id { type: number }
				dimension: acct { type: number label: "Account ID" }
				dimension: key { type: number description: "Unique identifier for row" }
			} }`));
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/dimension:account_num',
				description: expect.stringContaining('value_format_name: id'),
			});
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/dimension:user_id',
				description: expect.stringContaining('value_format_name: id'),
			});
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/dimension:acct',
				description: expect.stringContaining('value_format_name: id'),
			});
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/dimension:key',
				description: expect.stringContaining('value_format_name: id'),
			});
		});

		it('should suggest value_format_name: usd_* for numeric USD fields by name, label, or description', () => {
			let result = rule(parse(`model: m { view: v {
				measure: total_usd { type: number }
				dimension: price { type: number label: "Unit Price ($)" }
				measure: spend { type: number description: "Total spend in dollars" }
			} }`));
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/measure:total_usd',
				description: expect.stringContaining('usd'),
			});
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/dimension:price',
				description: expect.stringContaining('usd'),
			});
			expect(result).toContainMessage({
				...F8, ...error,
				location: 'model:m/view:v/measure:spend',
				description: expect.stringContaining('usd'),
			});
		});

		it('should respect fields_hidden_by_default on view', () => {
			let result = rule(parse(`model: m { view: v {
				fields_hidden_by_default: yes
				dimension: user_id { type: number }
			} }`));
			expect(result).not.toContainMessage({...F8, ...error});
		});
	});
});
