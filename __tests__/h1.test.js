/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/h1.js');
const {parse} = require('lookml-parser');
const r='H1';

describe('Rules', () => {
	describe(r, () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let verbose = {level: 'verbose'};
		let h1 = {rule: 'H1'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no views', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 0 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass 0-pk views, with a verbose message', () => {
			let result = rule(parse(`model: m {
				view: log {
					dimension: pk0_no_log_pk {
						hidden: yes
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).toContainMessage({...h1, ...verbose});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views without hoisted fields', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: name {}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h1, ...error});
		});

		it('should pass views with hoisted dimensions', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: account_id {
						label: "[Account ID]"
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass views with group-hoisted dimensions', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension: account_id {
						label: "Account ID"
						group_label: "[Identifiers]"
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should fail views only hoisted measures', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					measure: count {
						label: "[Count]"
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h1, ...error});
		});

		it('should fail views only hoisted dimension_groups', () => {
			let result = rule(parse(`model: m {
				view: accounts {
					dimension_group: created {
						label: "[Created Date]"
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 1 errors`,
			});
			expect(result).toContainMessage({...h1, ...error});
		});

		it('should pass views complying with a custom prefix/suffix', () => {
			let result = rule(parse(`
			manifest: {rule: H1 {options: {prefix:"(" suffix:")"}}}
			model: m {
				view: accounts {
					dimension: account_id {
						label: "(Account ID)"
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass views complying with 0/2+ length prefix/suffix', () => {
			let result = rule(parse(`
			manifest: {rule: H1 {options: {prefix:" 🔑 " suffix:""}}}
			model: m {
				view: accounts {
					dimension: account_id {
						label: " 🔑 Account ID"
					}
				}
			}`));
			expect(result).toContainMessage({...h1, ...info,
				description: `Rule ${r} summary: 1 matches, 0 matches exempt, and 0 errors`,
			});
			expect(result).not.toContainMessage(error);
		});
	});
});
