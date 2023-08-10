/* Copyright (c) 2018 Looker Data Sciences, Inc. See https://github.com/looker-open-source/look-at-me-sideways/blob/master/LICENSE.txt */
require('../lib/expect-to-contain-message');

const rule = require('../rules/e6.js');
const {parse} = require('lookml-parser');

describe('Rules', () => {
	describe('E6', () => {
		let info = {level: 'info'};
		let error = {level: 'error'};
		let e6 = {rule: 'E6'};

		it('should not match and pass if there are no models', () => {
			let result = rule(parse(`file: foo{}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 0 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no explores', () => {
			let result = rule(parse(`model: foo {}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 0 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass if there are no joins', () => {
			let result = rule(parse(`model: m {
				explore: orders {}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 0 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should not match and pass for joins without foreign_key', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 0 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass for implicit m:1 relationship', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass for explicit m:1 relationship', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: many_to_one
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should pass when the FK is the base-view\'s PK and uses 1:1 relationship', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: order_derived_columns {
						relationship: one_to_one
						foreign_key: pk1_order_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 0 errors',
			});
			expect(result).not.toContainMessage(error);
		});

		it('should error if a *:m relationship is specified', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: one_to_many
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e6, ...error});
		});

		it('should error if a 1:1 relationship is specified', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: users {
						relationship: one_to_one
						foreign_key: user_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e6, ...error});
		});

		it('should error if a *:m relationship is specified for joins from a pk', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: order_derived_columns {
						relationship: one_to_many
						foreign_key: pk1_order_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e6, ...error});
		});

		it('should error if a m:1 relationship is specified for joins from a pk', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: order_derived_columns {
						relationship: many_to_one
						foreign_key: pk1_order_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e6, ...error});
		});

		it('should error if a m:1 relationship is implicit for joins from a pk', () => {
			let result = rule(parse(`model: m {
				explore: orders {
					join: order_derived_columns {
						foreign_key: pk1_order_id
					}
				}
			}`));
			expect(result).toContainMessage({...e6, ...info,
				description: 'Rule E6 summary: 1 matches, 0 matches exempt, and 1 errors',
			});
			expect(result).toContainMessage({...e6, ...error});
		});
	});
});
