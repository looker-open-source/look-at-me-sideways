require('../lib/expect-to-contain-message');

const rule = require('../rules/h5.js');
const {parse} = require('lookml-parser');
const r='H5';

describe('Rules', () => {
	describe(r, () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let h5 = {rule: 'H5'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass no-join explores', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass hidden explores', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					hidden: yes
					join: users {}
				}
			}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail hidden explores, with the enforceHidden option', () => {
			let result = rule(parse(`
			manifest: {rule: H5 { options: { enforceHidden: yes }}}
			model: m {
				explore: orders {
					hidden: yes
					join: users {}
				}
			}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h5, ...error});
		});

		it('should fail explores without a hoisted view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {}
				}
			}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h5, ...error});
		});

		it('should pass explores with a hoisted view', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					view_label: "[Orders]"
					join: users {}
				}
			}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass explores hoisting a view with a custom prefix/suffix', () => {
			let result = rule(parse(`
			manifest: {rule: H5 {options: {prefix:" 🏁 " suffix:""}}}
			model: m {
				explore: orders {
					view_label: " 🏁 Orders"
					join: users {}
				}
			}`));
			expect(result).toContainMessage({...h5, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});
	});
});
