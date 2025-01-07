/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/h3.js');
const {parse} = require('lookml-parser');
const r='H3'

describe('Rules', () => {
	describe(r, () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let verbose = {level: 'verbose'};
		let h3 = {rule: 'H3'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no views', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...h3, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		//CONTINUE HERE

		it('should fail views with too many dimensions + dimension_groups', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: d1 {} dimension: d2 {} dimension: d3 {}
					dimension: d4 {} dimension: d5 {} dimension: d6 {}
					dimension: d7 {} dimension: d8 {} dimension: d9 {}
					dimension: d10 {} dimension: d11 {} dimension: d12 {}
					dimension: d13 {} dimension: d14 {} dimension: d15 {}
					dimension: d16 {} dimension: d17 {} dimension: d18 {}
					dimension_group: dg1 {} dimension_group: dg2 {} dimension_group: dg3 {}
				}
			}`));
			expect(result).toContainMessage({...h2, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h2, ...error});
		});

		it('should fail views with too many measures', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					measure: m1 {} measure: m2 {} measure: m3 {}
					measure: m4 {} measure: m5 {} measure: m6 {}
					measure: m7 {} measure: m8 {} measure: m9 {}
					measure: m10 {} measure: m11 {} measure: m12 {}
					measure: m13 {} measure: m14 {} measure: m15 {}
					measure: m16 {} measure: m17 {} measure: m18 {}
					measure: m19 {} measure: m20 {} measure: m21 {}
				}
			}`));
			expect(result).toContainMessage({...h2, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h2, ...error});
		});

		it('should fail twice with too many dimensions and too many measures', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: d1 {} dimension: d2 {} dimension: d3 {}
					dimension: d4 {} dimension: d5 {} dimension: d6 {}
					dimension: d7 {} dimension: d8 {} dimension: d9 {}
					dimension: d10 {} dimension: d11 {} dimension: d12 {}
					dimension: d13 {} dimension: d14 {} dimension: d15 {}
					dimension: d16 {} dimension: d17 {} dimension: d18 {}
					dimension: d19 {} dimension: d20 {} dimension: d21 {}
					measure: m1 {} measure: m2 {} measure: m3 {}
					measure: m4 {} measure: m5 {} measure: m6 {}
					measure: m7 {} measure: m8 {} measure: m9 {}
					measure: m10 {} measure: m11 {} measure: m12 {}
					measure: m13 {} measure: m14 {} measure: m15 {}
					measure: m16 {} measure: m17 {} measure: m18 {}
					measure: m19 {} measure: m20 {} measure: m21 {}
				}
			}`));
			expect(result).toContainMessage({...h2, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 2 errors`,
			});
			expect(result).toContainMessage({...h2, ...error});
		});

		it('should pass views with too many dimensions but group_label', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: d1 {} dimension: d2 {} dimension: d3 {group_label: "d3x"}
					dimension: d4 {} dimension: d5 {} dimension: d6 {group_label: "d3x"}
					dimension: d7 {} dimension: d8 {} dimension: d9 {group_label: "d3x"}
					dimension: d10 {} dimension: d11 {} dimension: d12 {}
					dimension: d13 {} dimension: d14 {} dimension: d15 {}
					dimension: d16 {} dimension: d17 {} dimension: d18 {}
					dimension: d19 {} dimension: d20 {} dimension: d21 {}
				}
			}`));
			expect(result).toContainMessage({...h2, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass views complying with a custom threshold', () => {
			let result = rule(parse(`
			manifest: {rule: H2 {options: {threshold:21}}}
			model: m {
				view: accounts {
					dimension: d1 {} dimension: d2 {} dimension: d3 {}
					dimension: d4 {} dimension: d5 {} dimension: d6 {}
					dimension: d7 {} dimension: d8 {} dimension: d9 {}
					dimension: d10 {} dimension: d11 {} dimension: d12 {}
					dimension: d13 {} dimension: d14 {} dimension: d15 {}
					dimension: d16 {} dimension: d17 {} dimension: d18 {}
					dimension: d19 {} dimension: d20 {} dimension: d21 {}
				}
			}`));
			expect(result).toContainMessage({...h2, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views not complying with a custom threshold', () => {
			let result = rule(parse(`
			manifest: {rule: H2 {options: {threshold:10}}}
			model: m {
				view: accounts {
					measure: m1 {} measure: m2 {} measure: m3 {}
					measure: m4 {} measure: m5 {} measure: m6 {}
					measure: m7 {} measure: m8 {} measure: m9 {}
					measure: m10 {} measure: m11 {} measure: m12 {}
				}
			}`));
			expect(result).toContainMessage({...h2, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h2, ...error});
		});

	});
});
