require('../lib/expect-to-contain-message');

const rule = require('../rules/h4.js');
const {parse} = require('lookml-parser');
const r='H4'

describe('Rules', () => {
	describe(r, () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let verbose = {level: 'verbose'};
		let h4 = {rule: 'H4'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no views', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views with too many top-level labels', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: d1 {} dimension: d2 {} dimension: d3 {}
					dimension: d4 {} dimension: d5 {} dimension: d6 {}
					dimension: d7 {} dimension: d8 {} dimension: d9 {}
					dimension: d10 {} dimension: d11 {} dimension: d12 {}
					dimension: d13 {} dimension: d14 {} dimension: d15 {}
					dimension: d16 {} dimension: d17 {} dimension: d18 {}
					dimension: d19 {} dimension: d20 {} dimension: d21 {}
					dimension: d22 {} dimension: d23 {} dimension: d24 {}
					dimension: d25 {} dimension: d26 {} dimension: d27 {}
					dimension: d28 {} dimension: d29 {} dimension: d30 {}
					dimension: d31{}
				}
			}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h4, ...error});
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
					dimension: d22 {} dimension: d23 {} dimension: d24 {}
					dimension: d25 {} dimension: d26 {} dimension: d27 {}
					dimension: d28 {} dimension: d29 {} dimension: d30 {}
					dimension: d31{}
					measure: m1 {} measure: m2 {} measure: m3 {}
					measure: m4 {} measure: m5 {} measure: m6 {}
					measure: m7 {} measure: m8 {} measure: m9 {}
					measure: m10 {} measure: m11 {} measure: m12 {}
					measure: m13 {} measure: m14 {} measure: m15 {}
					measure: m16 {} measure: m17 {} measure: m18 {}
					measure: m19 {} measure: m20 {} measure: m21 {}
					measure: m22 {} measure: m23 {} measure: m24 {}
					measure: m25 {} measure: m26 {} measure: m27 {}
					measure: m28 {} measure: m29 {} measure: m30 {}
					measure: m31{}
				}
			}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 2 errors`,
			});
			expect(result).toContainMessage({...h4, ...error});
		});

		it('should pass views with too many dimensions but <=30 top-level labels>', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					view: accounts {
						dimension: d1 {} dimension: d2 {} dimension: d3 {}
						dimension: d4 {} dimension: d5 {} dimension: d6 {}
						dimension: d7 {} dimension: d8 {} dimension: d9 {}
						dimension: d10 {} dimension: d11 {} dimension: d12 {}
						dimension: d13 {} dimension: d14 {} dimension: d15 {}
						dimension: d16 {} dimension: d17 {} dimension: d18 {}
						dimension: d19 {} dimension: d20 {} dimension: d21 {}
						dimension: d22 {} dimension: d23 {} dimension: d24 {}
						dimension: d25 {} dimension: d26 {} dimension: d27 {}
						dimension: d28 {} dimension: d29 {}
						dimension: g30d1 {group_label: "Junk Dims"}
						dimension: g30d2 {group_label: "Junk Dims"}
						dimension: g30d3 {group_label: "Junk Dims"}
						dimension: g30d4 {group_label: "Junk Dims"}
					}
				}
			}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views with too many top-level labels, counting distinct groups', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: d1 {} dimension: d2 {} dimension: d3 {}
					dimension: d4 {} dimension: d5 {} dimension: d6 {}
					dimension: d7 {} dimension: d8 {} dimension: d9 {}
					dimension: d10 {} dimension: d11 {} dimension: d12 {}
					dimension: d13 {} dimension: d14 {} dimension: d15 {}
					dimension: d16 {} dimension: d17 {} dimension: d18 {}
					dimension: d19 {} dimension: d20 {} dimension: d21 {}
					dimension: d22 {} dimension: d23 {} dimension: d24 {}
					dimension: d25 {} dimension: d26 {} dimension: d27 {}
					dimension: d28 {} dimension: d29 {}
					dimension: g30d1 {group_label: "Kinda Junk"}
					dimension: g30d2 {group_label: "Kinda Junk"}
					dimension: g31d1 {group_label: "Very Junk"}
					dimension: g31d2 {group_label: "Very Junk"}
				}
			}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h4, ...error});
		});

		it('should pass views using sort-grouping to remain under the threshold>', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					view: accounts {
						dimension: d1 {} dimension: d2 {} dimension: d3 {}
						dimension: d4 {} dimension: d5 {} dimension: d6 {}
						dimension: d7 {} dimension: d8 {} dimension: d9 {}
						dimension: d10 {} dimension: d11 {} dimension: d12 {}
						dimension: d13 {} dimension: d14 {} dimension: d15 {}
						dimension: d16 {} dimension: d17 {} dimension: d18 {}
						dimension: d19 {} dimension: d20 {} dimension: d21 {}
						dimension: d22 {} dimension: d23 {} dimension: d24 {}
						dimension: d25 {} dimension: d26 {} dimension: d27 {}
						dimension: d28 {} dimension: d29 {}
						dimension: g30d1 {group_label: "Junk > Kinda"}
						dimension: g30d2 {group_label: "Junk > Kinda"}
						dimension: g31d1 {group_label: "Junk > Very"}
						dimension: g31d2 {group_label: "Junk > Very"}
					}
				}
			}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass views using custom-delimiter sort-grouping to remain under the threshold>', () => {
			let result = rule(parse(`
			manifest: {rule: H4 {options: {delimiter: ": "}}}
			model: m {
				view: accounts {
					view: accounts {
						dimension: d1 {} dimension: d2 {} dimension: d3 {}
						dimension: d4 {} dimension: d5 {} dimension: d6 {}
						dimension: d7 {} dimension: d8 {} dimension: d9 {}
						dimension: d10 {} dimension: d11 {} dimension: d12 {}
						dimension: d13 {} dimension: d14 {} dimension: d15 {}
						dimension: d16 {} dimension: d17 {} dimension: d18 {}
						dimension: d19 {} dimension: d20 {} dimension: d21 {}
						dimension: d22 {} dimension: d23 {} dimension: d24 {}
						dimension: d25 {} dimension: d26 {} dimension: d27 {}
						dimension: d28 {} dimension: d29 {}
						dimension: g30d1 {group_label: "Junk: Kinda"}
						dimension: g30d2 {group_label: "Junk: Kinda"}
						dimension: g31d1 {group_label: "Junk: Very"}
						dimension: g31d2 {group_label: "Junk: Very"}
					}
				}
			}`));
			expect(result).toContainMessage({...h4, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

	});
});
