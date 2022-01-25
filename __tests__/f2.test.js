/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/f2');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('F2', () => {
		let errorMessageF2 = {
			rule: 'F2',
			exempt: false,
			level: 'error',
		};

		it('should not error if there are no files', () => {
			let result = rule(parse(``));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`files:{} files:{}`));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should not error for a view with no fields', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {}
			}`));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should not error for a field with no view_label', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {}
				}
			}`));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should error for a dimension with a view_label', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for a measure with a view_label', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					measure: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for a filter with a view label', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					filter: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for a parameter with a view label', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					parameter: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for an empty-string view_label', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar { view_label: "" }
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should not error for an F2 exempted view', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					rule_exemptions: {F2: "foo"}
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should not error for an F2 exempted field', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {
						rule_exemptions: {F2: "foo"}
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should not error for an F2 exempted project', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {
						rule_exemptions: {F2: "foo"}
						view_label: "Foo2"
					}
				}
			}
			manifest: {rule_exemptions: {F2: "It's okay, this is exempt"}}`));
			expect(result).not.toContainMessage(errorMessageF2);
		});

		it('should error for an F2 exempted field if no reason is specified', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {
						rule_exemptions: {F2: ""}
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					rule_exemptions: {X1: "bar"}
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for an otherwise exempted field', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {
						rule_exemptions: {X1: "bar"}
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).toContainMessage(errorMessageF2);
		});

		it('should error for an otherwise exempted project', () => {
			let result = rule(parse(`files:{} files:{
				view: foo {
					dimension: bar {
						view_label: "Foo2"
					}
				}
			}
			manifest: {rule_exemptions: {X1: "Different exemption"}}`));
			expect(result).toContainMessage(errorMessageF2);
		});
	});
});
