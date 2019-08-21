/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/f4');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('F4', () => {
		let warnMessageF4 = {
			rule: 'F4',
			exempt: false,
			level: 'warning',
		};

		it('should not warn if there are no files', () => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should not warn if there are no views', () => {
			let result = rule(parse(` files:{} files:{}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should not warn for a view with no fields', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should warn for a dimension with no description and no hidden', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					dimension: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should warn for a dimension with no description and hidden:no', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					dimension: bar { hidden: no }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should warn for a dimension with an empty string description', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					dimension: bar { description: "" }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should not warn for a dimension with hidden:yes', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					dimension: bar { hidden: yes }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should not warn for a dimension with a non-blank description', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					dimension: bar { description: "Barry bar" }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should warn for measures', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					measure: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should warn for filters', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					filter: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should warn for parameters', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					parameter: bar {}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should not error for an F4 exempted view', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					rule_exemptions: {F4: "Descriptions are for explorers. Who cares."}
					measure: bar { type:count }
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should not error for an F4 exempted field', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					measure: bar {
						rule_exemptions: {F4: "Descriptions are for explorers. Who cares."}
						type: count
					}
				}
			}`));
			expect(result).not.toContainMessage(warnMessageF4);
		});

		it('should error for an F4 exempted view if no reason is specified', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					rule_exemptions: {F4: ""}
					measure: bar { type:count }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					rule_exemptions: {X: "foo"}
					measure: bar { type: count }
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});

		it('should error for an otherwise exempted field', () => {
			let result = rule(parse(` files:{} files:{
				view: foo {
					measure: bar {
						rule_exemptions: {X: "foo"}
						type: count
					}
				}
			}`));
			expect(result).toContainMessage(warnMessageF4);
		});
	});
});
