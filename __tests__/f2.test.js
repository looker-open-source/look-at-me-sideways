/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/f2');
const {parse} = require('lookml-parser');

const F2 = {rule: 'F2'};
const error = {level: 'error'};
let summary = (m=1, ex=0, er=1) => ({
	...F2,
	level: 'info',
	description: `Rule F2 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});

describe('Rules', () => {
	describe('F2', () => {
		it('should not error if the project is empty', () => {
			let result = rule(parse(``));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`model: my_model {}`));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for a view with no fields', () => {
			let result = rule(parse(`model: my_model {
				view: foo {}
			}`));
			expect(result).toContainMessage(summary(0, 0, 0));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for a field with no view_label', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: bar {}
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 0));
			expect(result).not.toContainMessage({...error});
		});

		it('should error for a dimension with a view_label', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage(summary(1, 0, 1));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should error for a measure with a view_label', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					measure: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should error for a filter with a view label', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					filter: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should error for a parameter with a view label', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					parameter: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should error for an empty-string view_label', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: bar { view_label: "" }
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should not error for an F2 exempted view', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					rule_exemptions: {F2: "foo"}
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).not.toContainMessage({...error});
		});

		it('should not error for an F2 exempted field', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: bar {
						rule_exemptions: {F2: "foo"}
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).not.toContainMessage({...error});
		});

		// Manifest-level exemptions are currently not considered when the rule is manually invoked
		// Maybe change this to redundantly check for the exemption anyway
		//
		// it('should not error for an F2 exempted project', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			dimension: bar {
		// 				rule_exemptions: {F2: "foo"}
		// 				view_label: "Foo2"
		// 			}
		// 		}
		// 	}
		// 	manifest: {rule_exemptions: {F2: "It's okay, this is exempt"}}`));
		// 	expect(result).not.toContainMessage(errorMessageF2);
		// });

		it('should error for an F2 exempted field if no reason is specified', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: bar {
						rule_exemptions: {F2: ""}
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should error for an otherwise exempted view', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					rule_exemptions: {X1: "bar"}
					dimension: bar { view_label: "Foo2" }
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		it('should error for an otherwise exempted field', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					dimension: bar {
						rule_exemptions: {X1: "bar"}
						view_label: "Foo2"
					}
				}
			}`));
			expect(result).toContainMessage({...F2, ...error});
		});

		// Manifest-level exemptions are currently not considered when the rule is manually invoked
		// Maybe change this to redundantly check for the exemption anyway
		//
		// it('should error for an otherwise exempted project', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			dimension: bar {
		// 				view_label: "Foo2"
		// 			}
		// 		}
		// 	}
		// 	manifest: {rule_exemptions: {X1: "Different exemption"}}`));
		// 	expect(result).toContainMessage(errorMessageF2);
		// });
	});
});
