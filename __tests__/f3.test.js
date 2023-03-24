/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/f3');
const {parse} = require('lookml-parser');

let F3 = {rule: 'F3'};
let error = {level: 'error'};

let summary = (m=1, ex=0, er=1) => ({
	...F3,
	level: 'info',
	description: `Rule F3 summary: ${m} matches, ${ex} matches exempt, and ${er} errors`,
});

describe('Rules', () => {
	describe('F3', () => {
		it('should not error if there are no files', () => {
			let result = rule(parse(``));
			expect(result).toContainMessage({...F3, ...summary(0, 0, 0)});
			expect(result).not.toContainMessage({...F3, ...error});
		});

		it('should not error if there are no views', () => {
			let result = rule(parse(`model: my_model {}`));
			expect(result).toContainMessage({...F3, ...summary(0, 0, 0)});
			expect(result).not.toContainMessage({...F3, ...error});
		});

		it('should not error for a view with no fields', () => {
			let result = rule(parse(`model: my_model {
				view: foo {}
			}`));
			expect(result).toContainMessage({...F3, ...summary(0, 0, 0)});
			expect(result).not.toContainMessage({...F3, ...error});
		});

		it('should error for a measure with a type:count and no filter', () => {
			let result = rule(parse(`model: my_model {
				view: foo {
					measure: bar { type: count }
				}
			}`));
			expect(result).toContainMessage({...F3, ...summary(1, 0, 1)});
			expect(result).toContainMessage({...F3, ...error});
		});

		// it('should not error for a measure with a type:count and 1 filter', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			measure: bar {
		// 				type: count
		// 				filters: {
		// 					field: id
		// 					value: "-null"
		// 				}
		// 			}
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 0, 0)});
		// 	expect(result).not.toContainMessage({...F3, ...error});
		// });

		// it('should not error for a measure with a type:count and 2 filter', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			measure: bar {
		// 				type: count
		// 				filters: {
		// 					field: id
		// 					value: "-null"
		// 				}
		// 				filters: {
		// 					field: baz
		// 					value: "active"
		// 				}
		// 			}
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 0, 0)});
		// 	expect(result).not.toContainMessage({...F3, ...error});
		// });

		// it('should not error for an F3 exempted view', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			rule_exemptions: {F3: "Filters on measures? No way, I like incorrect counts every now and then"}
		// 			measure: bar { type:count }
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 1, 0)});
		// 	expect(result).not.toContainMessage({...F3, ...error});
		// });

		// it('should not error for an F3 exempted field', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			measure: bar {
		// 				rule_exemptions: {F3: "Filters on measures? No way, I like incorrect counts every now and then"}
		// 				type: count
		// 			}
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 1, 0)});
		// 	expect(result).not.toContainMessage({...F3, ...error});
		// });

		// it('should error for an F3 exempted field if no reason is specified', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			measure: bar {
		// 				rule_exemptions: {F3: ""}
		// 				type: count
		// 			}
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 0, 1)});
		// 	expect(result).toContainMessage({...F3, ...error});
		// });

		// it('should error for an otherwise exempted view', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			rule_exemptions: {X1: "foo"}
		// 			measure: bar { type: count }
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 0, 1)});
		// 	expect(result).toContainMessage({...F3, ...error});
		// });

		// it('should error for an otherwise exempted field', () => {
		// 	let result = rule(parse(`model: my_model {
		// 		view: foo {
		// 			measure: bar {
		// 				rule_exemptions: {X1: "foo"}
		// 				type: count
		// 			}
		// 		}
		// 	}`));
		// 	expect(result).toContainMessage({...F3, ...summary(1, 0, 1)});
		// 	expect(result).toContainMessage({...F3, ...error});
		// });
	});
});
