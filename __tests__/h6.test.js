/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/h6.js');
const {parse} = require('lookml-parser');
const r='H6';

describe('Rules', () => {
	describe(r, () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let h6 = {rule: 'H6'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail explores with too many view labels', () => {
			let result = rule(parse(`model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {} join: v20 {}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h6, ...error});
		});

		it('should pass explores with <=20 view labels>', () => {
			let result = rule(parse(`model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass explores using sort groups to comply with the threshold', () => {
			let result = rule(parse(`model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {view_label: "Junk > V19"}
					join: v20 {view_label: "Junk > V20"}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});


		it('should pass explores using sort groups (including prefix-only) to comply with the threshold', () => {
			let result = rule(parse(`model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {}
					join: v20 {view_label: "V19 > More"}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass explores using sort groups (including explore) to comply with the threshold', () => {
			let result = rule(parse(`model: m {
				explore: e {
					view_label: "E > Base"
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {}
					join: v20 {view_label: "E > More"}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views with sort groups that don\'t help to comply with the threshold>', () => {
			let result = rule(parse(`model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {view_label: "Junk > V19"}
					join: v20 {view_label: "Other > V20"}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h6, ...error});
		});

		it('should pass views using custom-delimiter sort-grouping to comply with the threshold', () => {
			let result = rule(parse(`
			manifest: {rule: H6 {options: {delimiter: ": "}}}
			model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {view_label: "Junk: V19"}
					join: v20 {view_label: "Junk: V20"}
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass views using view-level sort-grouping to comply with the threshold', () => {
			let result = rule(parse(`
			model: m {
				explore: e {
					join: v1 {} join: v2 {} join: v3 {}
					join: v4 {} join: v5 {} join: v6 {}
					join: v7 {} join: v8 {} join: v9 {}
					join: v10 {} join: v11 {} join: v12 {}
					join: v13 {} join: v14 {} join: v15 {}
					join: v16 {} join: v17 {} join: v18 {}
					join: v19 {view_label: "Junk > V19"}
					join: v20 {}
				}
				view: v20 {
					label: "Junk > V20"
				}
			}`));
			expect(result).toContainMessage({...h6, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});
	});
});
